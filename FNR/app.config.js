import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };
};
