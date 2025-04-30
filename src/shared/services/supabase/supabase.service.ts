import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  getClient() {
    return this.supabase;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  // 👇 NUEVO: Subida de imágenes
  async uploadImage(file: Express.Multer.File, path: string) {
    const { data, error } = await this.supabase.storage
      .from('products')
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw new Error(error.message);

    const { data: urlData } = this.supabase.storage
      .from('products')
      .getPublicUrl(path);

    return urlData.publicUrl;
  }
}
