import { defineConfig } from "cypress";
import { createServerSupabase } from './utils/supabase/server';
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  projectId: '9drph3',
  e2e: {
    setupNodeEvents(on) {
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
            const update: { namesite: string; ab_county: number | null; is_active?: boolean } = { namesite: originalName, ab_county: originalCountyId };
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
            .select("id, namesite, ab_county, is_active, protected_area_id")
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
        // Cleanup for sites a spec creates (add_site, deactivate_site). Only names that start with "E2E Added".
        async deleteAddedSites() {
          const supabase = createServerSupabase();
          await supabase.from("sites_pa").delete().like("namesite", "E2E Added%");
          return null;
        },
        async getReport(inspectionNo: string) {
          const supabase = createServerSupabase();
          const { data } = await supabase
            .from("form_responses")
            .select("id, site_id, is_active, archived_at, answers(count)")
            .eq("inspection_no", inspectionNo)
            .single();
          return data;
        },
        async restoreReport(inspectionNo: string) {
          const supabase = createServerSupabase();
          await supabase.from("form_responses").update({ archived_at: null, is_active: true }).eq("inspection_no", inspectionNo);
          return null;
        },
      });
    },
  },
});