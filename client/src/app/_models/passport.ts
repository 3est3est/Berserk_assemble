export interface Passport {
  id: number;
  token: string; //jwt_model
  display_name: string;
  avatar_url?: string;
  bio?: string;
  discord_id?: string;
  contact_email?: string;
  instagram?: string;
  facebook?: string;
}

export interface RegisterModel {
  username: string;
  password: string;
  display_name: string;
}

export interface LoginModel {
  username: string;
  password: string;
}
