import { defineConfig } from "cypress";
import { createServerSupabase } from './utils/supabase/server';
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  allowCypressEnv: true,
  e2e: {
    baseUrl: 'http://localhost:3000/',
    setupNodeEvents(on, config) {
      on('task', {
        async clearEditSiteInspectionFormResponse(questionText: string) {
          const supabase = createServerSupabase();
          const { data: answer } = await supabase
            .from("W26_answers")
            .select("*")
            .eq('response_id', 123456789)
            .eq('question_id', 28)
            .single();
          if (answer != null ) {
            await supabase.from("W26_answers").delete().eq("id", answer.id);
          }
          return null;
        }
      });
    },
  },
});