export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abonnements: {
        Row: {
          created_at: string
          debut: string
          entreprise_id: string
          fin: string | null
          fin_essai: string | null
          id: string
          plan_id: string | null
          reference_paiement: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          debut?: string
          entreprise_id: string
          fin?: string | null
          fin_essai?: string | null
          id?: string
          plan_id?: string | null
          reference_paiement?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          debut?: string
          entreprise_id?: string
          fin?: string | null
          fin_essai?: string | null
          id?: string
          plan_id?: string | null
          reference_paiement?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abonnements_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: true
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          actif: boolean
          couleur: string | null
          created_at: string
          description: string | null
          entreprise_id: string
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          couleur?: string | null
          created_at?: string
          description?: string | null
          entreprise_id: string
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          couleur?: string | null
          created_at?: string
          description?: string | null
          entreprise_id?: string
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      categories_depense: {
        Row: {
          couleur: string | null
          created_at: string
          entreprise_id: string
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          couleur?: string | null
          created_at?: string
          entreprise_id: string
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          couleur?: string | null
          created_at?: string
          entreprise_id?: string
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_depense_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          actif: boolean
          adresse: string | null
          created_at: string
          date_naissance: string | null
          email: string | null
          entreprise_id: string
          id: string
          niveau: Database["public"]["Enums"]["niveau_fidelite"]
          nom: string
          notes: string | null
          points_fidelite: number
          sexe: Database["public"]["Enums"]["sexe_type"]
          telephone: string | null
          updated_at: string
          ville: string | null
          whatsapp: string | null
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          created_at?: string
          date_naissance?: string | null
          email?: string | null
          entreprise_id: string
          id?: string
          niveau?: Database["public"]["Enums"]["niveau_fidelite"]
          nom: string
          notes?: string | null
          points_fidelite?: number
          sexe?: Database["public"]["Enums"]["sexe_type"]
          telephone?: string | null
          updated_at?: string
          ville?: string | null
          whatsapp?: string | null
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          created_at?: string
          date_naissance?: string | null
          email?: string | null
          entreprise_id?: string
          id?: string
          niveau?: Database["public"]["Enums"]["niveau_fidelite"]
          nom?: string
          notes?: string | null
          points_fidelite?: number
          sexe?: Database["public"]["Enums"]["sexe_type"]
          telephone?: string | null
          updated_at?: string
          ville?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      commandes_achat: {
        Row: {
          created_at: string
          date_commande: string
          date_livraison_prevue: string | null
          date_reception: string | null
          entreprise_id: string
          fournisseur_id: string | null
          id: string
          mode_paiement: string | null
          montant_paye: number
          montant_total: number
          notes: string | null
          numero: string
          statut: Database["public"]["Enums"]["statut_commande"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_commande?: string
          date_livraison_prevue?: string | null
          date_reception?: string | null
          entreprise_id: string
          fournisseur_id?: string | null
          id?: string
          mode_paiement?: string | null
          montant_paye?: number
          montant_total?: number
          notes?: string | null
          numero: string
          statut?: Database["public"]["Enums"]["statut_commande"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_commande?: string
          date_livraison_prevue?: string | null
          date_reception?: string | null
          entreprise_id?: string
          fournisseur_id?: string | null
          id?: string
          mode_paiement?: string | null
          montant_paye?: number
          montant_total?: number
          notes?: string | null
          numero?: string
          statut?: Database["public"]["Enums"]["statut_commande"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commandes_achat_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commandes_achat_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      conges: {
        Row: {
          created_at: string
          date_debut: string
          date_fin: string
          employe_id: string
          entreprise_id: string
          id: string
          motif: string | null
          statut: Database["public"]["Enums"]["statut_conge"]
          type_conge: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_debut: string
          date_fin: string
          employe_id: string
          entreprise_id: string
          id?: string
          motif?: string | null
          statut?: Database["public"]["Enums"]["statut_conge"]
          type_conge?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_debut?: string
          date_fin?: string
          employe_id?: string
          entreprise_id?: string
          id?: string
          motif?: string | null
          statut?: Database["public"]["Enums"]["statut_conge"]
          type_conge?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conges_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conges_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      depenses: {
        Row: {
          beneficiaire: string | null
          categorie_depense_id: string | null
          created_at: string
          date_depense: string
          employe_id: string | null
          entreprise_id: string
          id: string
          justificatif_url: string | null
          libelle: string
          magasin_id: string | null
          mode_paiement: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          observation: string | null
          updated_at: string
        }
        Insert: {
          beneficiaire?: string | null
          categorie_depense_id?: string | null
          created_at?: string
          date_depense?: string
          employe_id?: string | null
          entreprise_id: string
          id?: string
          justificatif_url?: string | null
          libelle: string
          magasin_id?: string | null
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          observation?: string | null
          updated_at?: string
        }
        Update: {
          beneficiaire?: string | null
          categorie_depense_id?: string | null
          created_at?: string
          date_depense?: string
          employe_id?: string | null
          entreprise_id?: string
          id?: string
          justificatif_url?: string | null
          libelle?: string
          magasin_id?: string | null
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"]
          montant?: number
          observation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "depenses_categorie_depense_id_fkey"
            columns: ["categorie_depense_id"]
            isOneToOne: false
            referencedRelation: "categories_depense"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depenses_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depenses_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depenses_magasin_id_fkey"
            columns: ["magasin_id"]
            isOneToOne: false
            referencedRelation: "magasins"
            referencedColumns: ["id"]
          },
        ]
      }
      employes: {
        Row: {
          actif: boolean
          adresse: string | null
          created_at: string
          date_embauche: string
          email: string | null
          entreprise_id: string
          id: string
          magasin_id: string | null
          matricule: string
          nom_complet: string
          photo_url: string | null
          poste: string | null
          role: Database["public"]["Enums"]["app_role"]
          salaire_base: number
          telephone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          created_at?: string
          date_embauche?: string
          email?: string | null
          entreprise_id: string
          id?: string
          magasin_id?: string | null
          matricule: string
          nom_complet: string
          photo_url?: string | null
          poste?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          salaire_base?: number
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          created_at?: string
          date_embauche?: string
          email?: string | null
          entreprise_id?: string
          id?: string
          magasin_id?: string | null
          matricule?: string
          nom_complet?: string
          photo_url?: string | null
          poste?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          salaire_base?: number
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employes_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employes_magasin_id_fkey"
            columns: ["magasin_id"]
            isOneToOne: false
            referencedRelation: "magasins"
            referencedColumns: ["id"]
          },
        ]
      }
      entrees_stock: {
        Row: {
          created_at: string
          date_entree: string
          employe_id: string | null
          entreprise_id: string
          fournisseur_id: string | null
          id: string
          magasin_id: string | null
          montant_total: number
          numero: string
          observation: string | null
          reference_facture: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_entree?: string
          employe_id?: string | null
          entreprise_id: string
          fournisseur_id?: string | null
          id?: string
          magasin_id?: string | null
          montant_total?: number
          numero: string
          observation?: string | null
          reference_facture?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_entree?: string
          employe_id?: string | null
          entreprise_id?: string
          fournisseur_id?: string | null
          id?: string
          magasin_id?: string | null
          montant_total?: number
          numero?: string
          observation?: string | null
          reference_facture?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrees_stock_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrees_stock_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrees_stock_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrees_stock_magasin_id_fkey"
            columns: ["magasin_id"]
            isOneToOne: false
            referencedRelation: "magasins"
            referencedColumns: ["id"]
          },
        ]
      }
      entreprises: {
        Row: {
          actif: boolean
          adresse: string | null
          couleur_primaire: string | null
          created_at: string
          devise: string
          email: string | null
          id: string
          logo_url: string | null
          nom: string
          numero_fiscal: string | null
          pays: string | null
          secteur: string
          slug: string
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          couleur_primaire?: string | null
          created_at?: string
          devise?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          nom: string
          numero_fiscal?: string | null
          pays?: string | null
          secteur?: string
          slug: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          couleur_primaire?: string | null
          created_at?: string
          devise?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          nom?: string
          numero_fiscal?: string | null
          pays?: string | null
          secteur?: string
          slug?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      fournisseurs: {
        Row: {
          actif: boolean
          adresse: string | null
          conditions_paiement: string | null
          contact_principal: string | null
          created_at: string
          delai_livraison_jours: number
          email: string | null
          entreprise: string | null
          entreprise_id: string
          favori: boolean
          id: string
          logo_url: string | null
          nom: string
          notes: string | null
          pays: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
          whatsapp: string | null
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          conditions_paiement?: string | null
          contact_principal?: string | null
          created_at?: string
          delai_livraison_jours?: number
          email?: string | null
          entreprise?: string | null
          entreprise_id: string
          favori?: boolean
          id?: string
          logo_url?: string | null
          nom: string
          notes?: string | null
          pays?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
          whatsapp?: string | null
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          conditions_paiement?: string | null
          contact_principal?: string | null
          created_at?: string
          delai_livraison_jours?: number
          email?: string | null
          entreprise?: string | null
          entreprise_id?: string
          favori?: boolean
          id?: string
          logo_url?: string | null
          nom?: string
          notes?: string | null
          pays?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fournisseurs_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      inventaires: {
        Row: {
          created_at: string
          date_inventaire: string
          ecart_valeur: number
          employe_id: string | null
          entreprise_id: string
          id: string
          magasin_id: string | null
          numero: string
          observation: string | null
          statut: Database["public"]["Enums"]["statut_inventaire"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_inventaire?: string
          ecart_valeur?: number
          employe_id?: string | null
          entreprise_id: string
          id?: string
          magasin_id?: string | null
          numero: string
          observation?: string | null
          statut?: Database["public"]["Enums"]["statut_inventaire"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_inventaire?: string
          ecart_valeur?: number
          employe_id?: string | null
          entreprise_id?: string
          id?: string
          magasin_id?: string | null
          numero?: string
          observation?: string | null
          statut?: Database["public"]["Enums"]["statut_inventaire"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventaires_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventaires_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventaires_magasin_id_fkey"
            columns: ["magasin_id"]
            isOneToOne: false
            referencedRelation: "magasins"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_audit: {
        Row: {
          acteur: string | null
          action: string
          adresse_ip: string | null
          created_at: string
          details: Json
          entite: string | null
          entite_id: string | null
          entreprise_id: string
          id: string
          user_id: string | null
        }
        Insert: {
          acteur?: string | null
          action: string
          adresse_ip?: string | null
          created_at?: string
          details?: Json
          entite?: string | null
          entite_id?: string | null
          entreprise_id: string
          id?: string
          user_id?: string | null
        }
        Update: {
          acteur?: string | null
          action?: string
          adresse_ip?: string | null
          created_at?: string
          details?: Json
          entite?: string | null
          entite_id?: string | null
          entreprise_id?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_audit_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_commande_achat: {
        Row: {
          commande_id: string
          created_at: string
          id: string
          nom_produit: string
          prix_achat: number
          produit_id: string | null
          quantite: number
          quantite_recue: number
          remise: number
        }
        Insert: {
          commande_id: string
          created_at?: string
          id?: string
          nom_produit: string
          prix_achat?: number
          produit_id?: string | null
          quantite: number
          quantite_recue?: number
          remise?: number
        }
        Update: {
          commande_id?: string
          created_at?: string
          id?: string
          nom_produit?: string
          prix_achat?: number
          produit_id?: string | null
          quantite?: number
          quantite_recue?: number
          remise?: number
        }
        Relationships: [
          {
            foreignKeyName: "lignes_commande_achat_commande_id_fkey"
            columns: ["commande_id"]
            isOneToOne: false
            referencedRelation: "commandes_achat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_commande_achat_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_entree_stock: {
        Row: {
          created_at: string
          date_expiration: string | null
          entree_id: string
          id: string
          lot: string | null
          prix_achat: number
          produit_id: string | null
          quantite: number
        }
        Insert: {
          created_at?: string
          date_expiration?: string | null
          entree_id: string
          id?: string
          lot?: string | null
          prix_achat?: number
          produit_id?: string | null
          quantite: number
        }
        Update: {
          created_at?: string
          date_expiration?: string | null
          entree_id?: string
          id?: string
          lot?: string | null
          prix_achat?: number
          produit_id?: string | null
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "lignes_entree_stock_entree_id_fkey"
            columns: ["entree_id"]
            isOneToOne: false
            referencedRelation: "entrees_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_entree_stock_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_inventaire: {
        Row: {
          created_at: string
          ecart: number | null
          id: string
          inventaire_id: string
          observation: string | null
          produit_id: string | null
          stock_physique: number
          stock_theorique: number
        }
        Insert: {
          created_at?: string
          ecart?: number | null
          id?: string
          inventaire_id: string
          observation?: string | null
          produit_id?: string | null
          stock_physique?: number
          stock_theorique?: number
        }
        Update: {
          created_at?: string
          ecart?: number | null
          id?: string
          inventaire_id?: string
          observation?: string | null
          produit_id?: string | null
          stock_physique?: number
          stock_theorique?: number
        }
        Relationships: [
          {
            foreignKeyName: "lignes_inventaire_inventaire_id_fkey"
            columns: ["inventaire_id"]
            isOneToOne: false
            referencedRelation: "inventaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_inventaire_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_retour: {
        Row: {
          created_at: string
          id: string
          montant: number
          produit_id: string | null
          quantite: number
          retour_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          montant?: number
          produit_id?: string | null
          quantite: number
          retour_id: string
        }
        Update: {
          created_at?: string
          id?: string
          montant?: number
          produit_id?: string | null
          quantite?: number
          retour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_retour_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_retour_retour_id_fkey"
            columns: ["retour_id"]
            isOneToOne: false
            referencedRelation: "retours"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_vente: {
        Row: {
          code_barres: string | null
          created_at: string
          id: string
          nom_produit: string
          prix_achat_unitaire: number
          prix_unitaire: number
          produit_id: string | null
          quantite: number
          total_ligne: number
          vente_id: string
        }
        Insert: {
          code_barres?: string | null
          created_at?: string
          id?: string
          nom_produit: string
          prix_achat_unitaire?: number
          prix_unitaire?: number
          produit_id?: string | null
          quantite: number
          total_ligne?: number
          vente_id: string
        }
        Update: {
          code_barres?: string | null
          created_at?: string
          id?: string
          nom_produit?: string
          prix_achat_unitaire?: number
          prix_unitaire?: number
          produit_id?: string | null
          quantite?: number
          total_ligne?: number
          vente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_vente_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_vente_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      magasins: {
        Row: {
          actif: boolean
          adresse: string | null
          code: string
          created_at: string
          entreprise_id: string
          id: string
          nom: string
          responsable: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          code: string
          created_at?: string
          entreprise_id: string
          id?: string
          nom: string
          responsable?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          code?: string
          created_at?: string
          entreprise_id?: string
          id?: string
          nom?: string
          responsable?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "magasins_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      mouvements_stock: {
        Row: {
          created_at: string
          date_mouvement: string
          employe_id: string | null
          entreprise_id: string
          id: string
          magasin_id: string | null
          observation: string | null
          produit_id: string
          quantite: number
          reference: string | null
          stock_apres: number | null
          stock_avant: number | null
          type: Database["public"]["Enums"]["type_mouvement"]
        }
        Insert: {
          created_at?: string
          date_mouvement?: string
          employe_id?: string | null
          entreprise_id: string
          id?: string
          magasin_id?: string | null
          observation?: string | null
          produit_id: string
          quantite: number
          reference?: string | null
          stock_apres?: number | null
          stock_avant?: number | null
          type: Database["public"]["Enums"]["type_mouvement"]
        }
        Update: {
          created_at?: string
          date_mouvement?: string
          employe_id?: string | null
          entreprise_id?: string
          id?: string
          magasin_id?: string | null
          observation?: string | null
          produit_id?: string
          quantite?: number
          reference?: string | null
          stock_apres?: number | null
          stock_avant?: number | null
          type?: Database["public"]["Enums"]["type_mouvement"]
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_stock_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_stock_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_stock_magasin_id_fkey"
            columns: ["magasin_id"]
            isOneToOne: false
            referencedRelation: "magasins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_stock_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entreprise_id: string
          id: string
          lien: string | null
          lue: boolean
          message: string | null
          priorite: string
          titre: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entreprise_id: string
          id?: string
          lien?: string | null
          lue?: boolean
          message?: string | null
          priorite?: string
          titre: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entreprise_id?: string
          id?: string
          lien?: string | null
          lue?: boolean
          message?: string | null
          priorite?: string
          titre?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      objectifs: {
        Row: {
          actif: boolean
          categorie: string
          cible: number
          created_at: string
          date_debut: string
          date_fin: string
          employe_id: string | null
          entreprise_id: string
          id: string
          titre: string
          unite: string | null
          updated_at: string
          valeur_actuelle: number
        }
        Insert: {
          actif?: boolean
          categorie?: string
          cible?: number
          created_at?: string
          date_debut?: string
          date_fin?: string
          employe_id?: string | null
          entreprise_id: string
          id?: string
          titre: string
          unite?: string | null
          updated_at?: string
          valeur_actuelle?: number
        }
        Update: {
          actif?: boolean
          categorie?: string
          cible?: number
          created_at?: string
          date_debut?: string
          date_fin?: string
          employe_id?: string | null
          entreprise_id?: string
          id?: string
          titre?: string
          unite?: string | null
          updated_at?: string
          valeur_actuelle?: number
        }
        Relationships: [
          {
            foreignKeyName: "objectifs_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectifs_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_vente: {
        Row: {
          created_at: string
          id: string
          mode: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          reference: string | null
          vente_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          reference?: string | null
          vente_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["mode_paiement"]
          montant?: number
          reference?: string | null
          vente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_vente_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres: {
        Row: {
          cle: string
          created_at: string
          entreprise_id: string
          id: string
          updated_at: string
          valeur: Json
        }
        Insert: {
          cle: string
          created_at?: string
          entreprise_id: string
          id?: string
          updated_at?: string
          valeur?: Json
        }
        Update: {
          cle?: string
          created_at?: string
          entreprise_id?: string
          id?: string
          updated_at?: string
          valeur?: Json
        }
        Relationships: [
          {
            foreignKeyName: "parametres_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          libelle: string
          module: string
          ordre: number
        }
        Insert: {
          code: string
          created_at?: string
          libelle: string
          module: string
          ordre?: number
        }
        Update: {
          code?: string
          created_at?: string
          libelle?: string
          module?: string
          ordre?: number
        }
        Relationships: []
      }
      plans: {
        Row: {
          actif: boolean
          code: string
          created_at: string
          description: string | null
          devise: string
          fonctionnalites: Json
          id: string
          max_magasins: number
          max_produits: number
          max_utilisateurs: number
          nom: string
          ordre: number
          prix_mensuel: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          code: string
          created_at?: string
          description?: string | null
          devise?: string
          fonctionnalites?: Json
          id?: string
          max_magasins?: number
          max_produits?: number
          max_utilisateurs?: number
          nom: string
          ordre?: number
          prix_mensuel?: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          code?: string
          created_at?: string
          description?: string | null
          devise?: string
          fonctionnalites?: Json
          id?: string
          max_magasins?: number
          max_produits?: number
          max_utilisateurs?: number
          nom?: string
          ordre?: number
          prix_mensuel?: number
          updated_at?: string
        }
        Relationships: []
      }
      presences: {
        Row: {
          created_at: string
          date_jour: string
          employe_id: string
          entreprise_id: string
          heure_arrivee: string | null
          heure_depart: string | null
          id: string
          observation: string | null
          statut: Database["public"]["Enums"]["statut_presence"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_jour?: string
          employe_id: string
          entreprise_id: string
          heure_arrivee?: string | null
          heure_depart?: string | null
          id?: string
          observation?: string | null
          statut?: Database["public"]["Enums"]["statut_presence"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_jour?: string
          employe_id?: string
          entreprise_id?: string
          heure_arrivee?: string | null
          heure_depart?: string | null
          id?: string
          observation?: string | null
          statut?: Database["public"]["Enums"]["statut_presence"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presences_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      produits: {
        Row: {
          actif: boolean
          categorie_id: string | null
          code_barres: string | null
          created_at: string
          date_expiration: string | null
          description: string | null
          entreprise_id: string
          fournisseur_id: string | null
          id: string
          image_url: string | null
          magasin_id: string | null
          marque: string | null
          nom: string
          prix_achat: number
          prix_vente: number
          reference: string | null
          stock: number
          stock_minimum: number
          unite: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          categorie_id?: string | null
          code_barres?: string | null
          created_at?: string
          date_expiration?: string | null
          description?: string | null
          entreprise_id: string
          fournisseur_id?: string | null
          id?: string
          image_url?: string | null
          magasin_id?: string | null
          marque?: string | null
          nom: string
          prix_achat?: number
          prix_vente?: number
          reference?: string | null
          stock?: number
          stock_minimum?: number
          unite?: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          categorie_id?: string | null
          code_barres?: string | null
          created_at?: string
          date_expiration?: string | null
          description?: string | null
          entreprise_id?: string
          fournisseur_id?: string | null
          id?: string
          image_url?: string | null
          magasin_id?: string | null
          marque?: string | null
          nom?: string
          prix_achat?: number
          prix_vente?: number
          reference?: string | null
          stock?: number
          stock_minimum?: number
          unite?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produits_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_magasin_id_fkey"
            columns: ["magasin_id"]
            isOneToOne: false
            referencedRelation: "magasins"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          actif: boolean
          avatar_url: string | null
          created_at: string
          email: string | null
          entreprise_id: string | null
          id: string
          magasin_id: string | null
          nom_complet: string
          telephone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actif?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          entreprise_id?: string | null
          id?: string
          magasin_id?: string | null
          nom_complet?: string
          telephone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actif?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          entreprise_id?: string | null
          id?: string
          magasin_id?: string | null
          nom_complet?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_magasin_fk"
            columns: ["magasin_id"]
            isOneToOne: false
            referencedRelation: "magasins"
            referencedColumns: ["id"]
          },
        ]
      }
      retours: {
        Row: {
          created_at: string
          date_retour: string
          employe_id: string | null
          entreprise_id: string
          id: string
          montant: number
          motif: string | null
          numero: string
          updated_at: string
          vente_id: string | null
        }
        Insert: {
          created_at?: string
          date_retour?: string
          employe_id?: string | null
          entreprise_id: string
          id?: string
          montant?: number
          motif?: string | null
          numero: string
          updated_at?: string
          vente_id?: string | null
        }
        Update: {
          created_at?: string
          date_retour?: string
          employe_id?: string | null
          entreprise_id?: string
          id?: string
          montant?: number
          motif?: string | null
          numero?: string
          updated_at?: string
          vente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retours_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retours_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retours_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          autorise: boolean
          created_at: string
          entreprise_id: string
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          autorise?: boolean
          created_at?: string
          entreprise_id: string
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          autorise?: boolean
          created_at?: string
          entreprise_id?: string
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      salaires: {
        Row: {
          created_at: string
          date_paiement: string | null
          employe_id: string
          entreprise_id: string
          id: string
          mode_paiement: string | null
          net_a_payer: number
          periode: string
          primes: number
          retenues: number
          salaire_base: number
          statut: Database["public"]["Enums"]["statut_salaire"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_paiement?: string | null
          employe_id: string
          entreprise_id: string
          id?: string
          mode_paiement?: string | null
          net_a_payer?: number
          periode: string
          primes?: number
          retenues?: number
          salaire_base?: number
          statut?: Database["public"]["Enums"]["statut_salaire"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_paiement?: string | null
          employe_id?: string
          entreprise_id?: string
          id?: string
          mode_paiement?: string | null
          net_a_payer?: number
          periode?: string
          primes?: number
          retenues?: number
          salaire_base?: number
          statut?: Database["public"]["Enums"]["statut_salaire"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salaires_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salaires_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions_caisse: {
        Row: {
          created_at: string
          ecart: number | null
          employe_id: string | null
          entreprise_id: string
          fermee_le: string | null
          fond_initial: number
          id: string
          magasin_id: string | null
          montant_final: number | null
          observation: string | null
          ouverte_le: string
          total_especes: number
          total_ventes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          ecart?: number | null
          employe_id?: string | null
          entreprise_id: string
          fermee_le?: string | null
          fond_initial?: number
          id?: string
          magasin_id?: string | null
          montant_final?: number | null
          observation?: string | null
          ouverte_le?: string
          total_especes?: number
          total_ventes?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          ecart?: number | null
          employe_id?: string | null
          entreprise_id?: string
          fermee_le?: string | null
          fond_initial?: number
          id?: string
          magasin_id?: string | null
          montant_final?: number | null
          observation?: string | null
          ouverte_le?: string
          total_especes?: number
          total_ventes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_caisse_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_caisse_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_caisse_magasin_id_fkey"
            columns: ["magasin_id"]
            isOneToOne: false
            referencedRelation: "magasins"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_tresorerie: {
        Row: {
          created_at: string
          date_transaction: string
          depense_id: string | null
          entreprise_id: string
          id: string
          libelle: string
          mode_paiement: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          type: Database["public"]["Enums"]["type_transaction"]
          updated_at: string
          vente_id: string | null
        }
        Insert: {
          created_at?: string
          date_transaction?: string
          depense_id?: string | null
          entreprise_id: string
          id?: string
          libelle: string
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          type: Database["public"]["Enums"]["type_transaction"]
          updated_at?: string
          vente_id?: string | null
        }
        Update: {
          created_at?: string
          date_transaction?: string
          depense_id?: string | null
          entreprise_id?: string
          id?: string
          libelle?: string
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"]
          montant?: number
          type?: Database["public"]["Enums"]["type_transaction"]
          updated_at?: string
          vente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_tresorerie_depense_id_fkey"
            columns: ["depense_id"]
            isOneToOne: false
            referencedRelation: "depenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tresorerie_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tresorerie_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          entreprise_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          entreprise_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          entreprise_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      ventes: {
        Row: {
          client_id: string | null
          client_nom: string | null
          client_telephone: string | null
          created_at: string
          date_vente: string
          entreprise_id: string
          id: string
          magasin_id: string | null
          monnaie: number
          montant_recu: number
          montant_tva: number
          numero: string
          observation: string | null
          remise: number
          session_caisse_id: string | null
          sous_total: number
          statut: Database["public"]["Enums"]["statut_vente"]
          taux_tva: number
          total: number
          updated_at: string
          vendeur_id: string | null
        }
        Insert: {
          client_id?: string | null
          client_nom?: string | null
          client_telephone?: string | null
          created_at?: string
          date_vente?: string
          entreprise_id: string
          id?: string
          magasin_id?: string | null
          monnaie?: number
          montant_recu?: number
          montant_tva?: number
          numero: string
          observation?: string | null
          remise?: number
          session_caisse_id?: string | null
          sous_total?: number
          statut?: Database["public"]["Enums"]["statut_vente"]
          taux_tva?: number
          total?: number
          updated_at?: string
          vendeur_id?: string | null
        }
        Update: {
          client_id?: string | null
          client_nom?: string | null
          client_telephone?: string | null
          created_at?: string
          date_vente?: string
          entreprise_id?: string
          id?: string
          magasin_id?: string | null
          monnaie?: number
          montant_recu?: number
          montant_tva?: number
          numero?: string
          observation?: string | null
          remise?: number
          session_caisse_id?: string | null
          sous_total?: number
          statut?: Database["public"]["Enums"]["statut_vente"]
          taux_tva?: number
          total?: number
          updated_at?: string
          vendeur_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_magasin_id_fkey"
            columns: ["magasin_id"]
            isOneToOne: false
            referencedRelation: "magasins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "sessions_caisse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_vendeur_id_fkey"
            columns: ["vendeur_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      a_permission: { Args: { _permission: string }; Returns: boolean }
      creer_entreprise: {
        Args: { _devise?: string; _nom: string; _secteur?: string }
        Returns: string
      }
      current_entreprise_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialiser_permissions: {
        Args: { _entreprise: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      mes_permissions: {
        Args: never
        Returns: {
          permission: string
        }[]
      }
      permissions_par_defaut: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: string[]
      }
    }
    Enums: {
      app_role:
        | "administrateur"
        | "directeur"
        | "manager"
        | "caissier"
        | "vendeur"
        | "magasinier"
        | "comptable"
      mode_paiement:
        | "especes"
        | "orange_money"
        | "moov_money"
        | "wave"
        | "carte"
        | "virement"
        | "cheque"
        | "credit"
      niveau_fidelite: "bronze" | "argent" | "or" | "platine"
      sexe_type: "F" | "H" | "non_precise"
      statut_commande:
        | "brouillon"
        | "envoyee"
        | "confirmee"
        | "preparation"
        | "expediee"
        | "recue"
        | "annulee"
      statut_conge: "en_attente" | "approuve" | "refuse"
      statut_inventaire: "en_cours" | "termine" | "annule"
      statut_presence: "present" | "absent" | "retard" | "conge"
      statut_produit: "disponible" | "faible" | "rupture" | "desactive"
      statut_salaire: "en_attente" | "paye"
      statut_vente: "payee" | "annulee" | "retour" | "en_attente"
      type_mouvement: "entree" | "sortie" | "ajustement" | "retour" | "perte"
      type_transaction: "encaissement" | "decaissement"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "administrateur",
        "directeur",
        "manager",
        "caissier",
        "vendeur",
        "magasinier",
        "comptable",
      ],
      mode_paiement: [
        "especes",
        "orange_money",
        "moov_money",
        "wave",
        "carte",
        "virement",
        "cheque",
        "credit",
      ],
      niveau_fidelite: ["bronze", "argent", "or", "platine"],
      sexe_type: ["F", "H", "non_precise"],
      statut_commande: [
        "brouillon",
        "envoyee",
        "confirmee",
        "preparation",
        "expediee",
        "recue",
        "annulee",
      ],
      statut_conge: ["en_attente", "approuve", "refuse"],
      statut_inventaire: ["en_cours", "termine", "annule"],
      statut_presence: ["present", "absent", "retard", "conge"],
      statut_produit: ["disponible", "faible", "rupture", "desactive"],
      statut_salaire: ["en_attente", "paye"],
      statut_vente: ["payee", "annulee", "retour", "en_attente"],
      type_mouvement: ["entree", "sortie", "ajustement", "retour", "perte"],
      type_transaction: ["encaissement", "decaissement"],
    },
  },
} as const
