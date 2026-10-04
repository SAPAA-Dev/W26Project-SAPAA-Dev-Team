import { defineConfig } from "cypress";
import { createServerSupabase } from './utils/supabase/server';
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  projectId: '9drph3',
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        async cleanupTestQuestion(questionText: string) {
          const supabase = createServerSupabase();
          const { data: question } = await supabase
            .from("questions")
            .select("id, question_key_id")
            .eq("form_question", questionText)
            .single();
          if (question != null ) {
            await supabase.from("questions").delete().eq("id", question.id);
            await supabase.from("question_keys").delete().eq("id", question.question_key_id);
          }
          return null;
        },
        async restoreSite({ namesite, originalName, originalCountyId, originalIsActive }: { namesite: string; originalName: string; originalCountyId: number | null; originalIsActive?: boolean }) {
          const supabase = createServerSupabase();
          const { data: site } = await supabase
            .from("sites_pa")
            .select("id")
            .eq("namesite", namesite)
            .single();
          if (site) {
            const update: any = { namesite: originalName, ab_county: originalCountyId };
            if (originalIsActive !== undefined) update.is_active = originalIsActive;
            await supabase
              .from("sites_pa")
              .update(update)
              .eq("id", site.id);
          }
          return null;
        },
        async getSiteInfo(namesite: string) {
          const supabase = createServerSupabase();
          const { data } = await supabase
            .from("sites_pa")
            .select("id, namesite, ab_county, is_active")
            .eq("namesite", namesite)
            .single();
          return data;
        },
        async setSiteActive({ namesite, is_active }: { namesite: string; is_active: boolean }) {
          const supabase = createServerSupabase();
          const { data: site } = await supabase
            .from("sites_pa")
            .select("id")
            .eq("namesite", namesite)
            .single();
          if (site) {
            await supabase
              .from("sites_pa")
              .update({ is_active })
              .eq("id", site.id);
          }
          return null;
        },
      });
    },
  },
});