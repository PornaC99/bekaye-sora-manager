import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('.env','utf8').split('\n').filter(Boolean).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]))
const URL = env.SUPABASE_URL, PUB = env.SUPABASE_PUBLISHABLE_KEY, SR = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(URL, SR, { auth:{persistSession:false} })
const stamp = Date.now()
const log = (...a)=>console.log(...a)

// entreprise cible = celle du directeur existant
const { data: dirProfile } = await admin.from('profiles').select('user_id, entreprise_id, email').eq('email','cissejulien7@gmail.com').maybeSingle()
const ent = dirProfile.entreprise_id
log('entreprise', ent)

async function creerCompte(email, pwd, role){
  const { data, error } = await admin.auth.admin.createUser({ email, password: pwd, email_confirm:true })
  if (error) throw error
  const uid = data.user.id
  await admin.from('profiles').update({ entreprise_id: ent, nom_complet: email.split('@')[0], actif:true }).eq('user_id', uid)
  await admin.from('user_roles').insert({ user_id: uid, entreprise_id: ent, role })
  return uid
}
const emailDir = `dir.test${stamp}@bekayesora.com`, emailCai = `cai.test${stamp}@bekayesora.com`
const pwd = 'Test2026!ok'
const uidDir = await creerCompte(emailDir, pwd, 'directeur')
const uidCai = await creerCompte(emailCai, pwd, 'caissier')
log('comptes créés', emailDir, emailCai)

// doublon email
const dup = await admin.auth.admin.createUser({ email: emailCai, password: pwd, email_confirm:true })
log('doublon refusé ?', !!dup.error, dup.error?.message)

const cli = (tok)=>createClient(URL,PUB,{auth:{persistSession:false},global:{headers:{Authorization:`Bearer ${tok}`}}})
async function signIn(email){ const c=createClient(URL,PUB,{auth:{persistSession:false}}); const {data,error}=await c.auth.signInWithPassword({email,password:pwd}); if(error)throw error; return cli(data.session.access_token) }
const dirC = await signIn(emailDir), caiC = await signIn(emailCai)

// --- VENTE par le caissier
const { data: vente, error: eV } = await caiC.from('ventes').insert({ entreprise_id: ent, total: 25000, sous_total:25000, client_nom:'Client Test', statut:'payee' }).select('id, numero').single()
log('vente caissier', eV?.message ?? vente)

// --- ENTREE de stock par le caissier ? non: par magasinier -> on crée un magasinier
const emailMag = `mag.test${stamp}@bekayesora.com`
const uidMag = await creerCompte(emailMag, pwd, 'magasinier')
const magC = await signIn(emailMag)
const { data: prod } = await admin.from('produits').select('id, nom, stock').eq('entreprise_id', ent).limit(1).maybeSingle()
const { data: entree, error: eE } = await magC.from('entrees_stock').insert({ entreprise_id: ent, numero:`ENT-T${stamp}`, montant_total: 120000 }).select('id, numero').single()
log('entrée stock', eE?.message ?? entree)

// --- SORTIE de stock via RPC
const { data: sortieId, error: eS } = await magC.rpc('creer_sortie_stock', { _produit_id: prod.id, _quantite: 1, _motif: 'perte', _commentaire:'test supervision' })
log('sortie stock', eS?.message ?? sortieId)

// --- Notifications côté directeur
const { data: notifs } = await dirC.from('notifications').select('titre, message, acteur, montant, quantite, lien, audience, entite, entite_id, created_at').eq('audience','direction').order('created_at',{ascending:false}).limit(6)
log('NOTIFS DIRECTEUR:', JSON.stringify(notifs,null,1))

// --- Confidentialité : caissier
const { data: nCai } = await caiC.from('notifications').select('id, titre, audience').eq('audience','direction')
log('notifs direction visibles par caissier:', nCai?.length, nCai)
const { data: nMag } = await magC.from('notifications').select('id').eq('audience','direction')
log('notifs direction visibles par magasinier:', nMag?.length)

// audit
const { data: audit } = await dirC.from('journal_audit').select('action, acteur, entite, details').order('created_at',{ascending:false}).limit(5)
log('AUDIT:', JSON.stringify(audit,null,1))

// détail vente accessible au directeur
const { data: detail } = await dirC.from('ventes').select('numero,total,statut').eq('id', vente.id).maybeSingle()
log('détail vente directeur:', detail)

// nettoyage comptes de test
for (const u of [uidDir, uidCai, uidMag]) await admin.auth.admin.deleteUser(u)
log('comptes de test supprimés')
