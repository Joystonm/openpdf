export type FieldType =
  | "recipient_name"
  | "course_name"
  | "date"
  | "organization"
  | "award_title"
  | "certificate_id"
  | "signature"
  | "qr_code"
  | "custom";

export type TextEffect =
  | "none"
  | "gradient"
  | "glow"
  | "shadow"
  | "outline"
  | "metallic"
  | "gold"
  | "silver"
  | "glass"
  | "neon";

export interface CertField {
  id: string;
  type: FieldType;
  label: string;
  x: number; // 0–1 relative to canvas
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  letterSpacing: number;
  lineHeight: number;
  color: string;
  align: "left" | "center" | "right";
  effect: TextEffect;
  autoFit: boolean;
  customLabel?: string;
}

export interface CertTemplate {
  id: string;
  name: string;
  background: string | null; // data URL or null for built-in
  fields: CertField[];
  builtIn?: BuiltInTemplate;
}

export type BuiltInTemplate =
  | "modern_startup"
  | "academic_excellence"
  | "course_completion"
  | "employee_recognition"
  | "hackathon_winner"
  | "luxury_gold";

export interface CsvRow {
  [key: string]: string;
}
