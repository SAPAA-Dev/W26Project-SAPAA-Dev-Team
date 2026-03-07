import { defineConfig } from "cypress";
import { createServerSupabase } from './utils/supabase/server';
import * as dotenv from "dotenv";
import path from "path";

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
        }
      });
    },
  },
});