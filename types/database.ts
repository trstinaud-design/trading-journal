export type AccountType = "evaluation" | "prop_finance" | "reel" | "demo";
export type Direction = "long" | "short";
export type Session = "asie" | "londres" | "ny" | "chevauchement_ldn_ny" | "hors_timing";
export type Emotion = "calme" | "confiant" | "impatient" | "fomo" | "revenge" | "stresse";
export type TradeStatus = "tp" | "sl" | "be" | "manuel";
export type ImageKind = "avant" | "pendant" | "apres";

export type Compte = {
  id: string;
  user_id: string;
  nom: string;
  type: AccountType;
  capital_initial: number;
  devise: string;
  default_risk_pct: number;
  created_at: string;
};

export type Setup = {
  id: string;
  user_id: string;
  nom: string;
  description: string | null;
  created_at: string;
};

export type Niveau = {
  id: string;
  user_id: string;
  nom: string;
  description: string | null;
  created_at: string;
};

export type PartialExit = {
  price: number;
  pct: number;      // pourcentage clôturé (0-100)
  r_partial: number; // R gagné/perdu sur cette portion
};

export type Trade = {
  id: string;
  user_id: string;
  compte_id: string | null;
  date_entree: string;
  paire: string;
  direction: Direction;
  session: Session | null;
  emotion: Emotion | null;
  prix_entree: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  statut: TradeStatus;
  risque_pct: number | null;
  taille_lots: number | null;
  resultat_r: number | null;
  resultat_usd: number | null;
  setup_id: string | null;
  niveau_id: string | null;
  respect_plan: boolean;
  commentaire: string | null;
  partial_exits: PartialExit[];
  created_at: string;
  updated_at: string;
};

export type TradeImage = {
  id: string;
  user_id: string;
  trade_id: string;
  kind: ImageKind;
  storage_path: string;
  created_at: string;
};

type CompteInsert = {
  id?: string;
  user_id: string;
  nom: string;
  type: AccountType;
  capital_initial?: number;
  devise?: string;
  created_at?: string;
};
type SetupInsert = {
  id?: string;
  user_id: string;
  nom: string;
  description?: string | null;
  created_at?: string;
};
type NiveauInsert = SetupInsert;
type TradeInsert = {
  id?: string;
  user_id: string;
  compte_id?: string | null;
  date_entree: string;
  paire: string;
  direction: Direction;
  session?: Session | null;
  emotion?: Emotion | null;
  prix_entree?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  statut: TradeStatus;
  risque_pct?: number | null;
  taille_lots?: number | null;
  resultat_r?: number | null;
  resultat_usd?: number | null;
  setup_id?: string | null;
  niveau_id?: string | null;
  respect_plan?: boolean;
  commentaire?: string | null;
  created_at?: string;
  updated_at?: string;
};
type TradeImageInsert = {
  id?: string;
  user_id: string;
  trade_id: string;
  kind: ImageKind;
  storage_path: string;
  created_at?: string;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      comptes:      { Row: Compte;     Insert: CompteInsert;     Update: Partial<CompteInsert>;     Relationships: [] };
      setups:       { Row: Setup;      Insert: SetupInsert;      Update: Partial<SetupInsert>;      Relationships: [] };
      niveaux:      { Row: Niveau;     Insert: NiveauInsert;     Update: Partial<NiveauInsert>;     Relationships: [] };
      trades:       { Row: Trade;      Insert: TradeInsert;      Update: Partial<TradeInsert>;      Relationships: [] };
      trade_images: { Row: TradeImage; Insert: TradeImageInsert; Update: Partial<TradeImageInsert>; Relationships: [] };
    };
    Views: { [k: string]: never };
    Functions: { [k: string]: never };
    Enums: {
      account_type: AccountType;
      direction: Direction;
      session: Session;
      emotion: Emotion;
      trade_status: TradeStatus;
      image_kind: ImageKind;
    };
    CompositeTypes: { [k: string]: never };
  };
};
