import { defineConfig } from "cypress";
import { createServerSupabase } from './utils/supabase/server';
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        async cleanupTestQuestion(questionText: string) {
          const supabase = createServerSupabase();
          const { data: question } = await supabase
            .from("W26_questions")
            .select("id, question_key_id")
            .eq("form_question", questionText)
            .single();
          if (question != null ) {
            await supabase.from("W26_questions").delete().eq("id", question.id);
            await supabase.from("W26_question_keys").delete().eq("id", question.question_key_id);
          }
          return null;
        },
        async getSiteInfo(siteName: string) {
          const supabase = createServerSupabase();
          const { data } = await supabase
            .from("W26_sites-pa")
            .select("id, namesite, ab_county")
            .eq("namesite", siteName)
            .single();
          return data ?? null;
        },
        async restoreSite({ namesite, originalName, originalCountyId }: { namesite: string; originalName: string; originalCountyId: number | null }) {
          const supabase = createServerSupabase();
          const { data: site } = await supabase
            .from("W26_sites-pa")
            .select("id")
            .eq("namesite", namesite)
            .single();
          if (site) {
            await supabase
              .from("W26_sites-pa")
              .update({ namesite: originalName, ab_county: originalCountyId })
              .eq("id", site.id);
          }
          return null;
        },
      });
    },
  },
});