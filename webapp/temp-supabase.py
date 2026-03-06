import os
import re
import sys
from dotenv import load_dotenv
from supabase import create_client
import pprint

class Tee:
    def __init__(self, file):
        self.file = file
        self.terminal = sys.__stdout__
    def write(self, message):
        self.terminal.write(message)
        self.file.write(message)
    def flush(self):
        self.terminal.flush()
        if not self.file.closed:
            self.file.flush()

log_file = open("migration_log.txt", "w")
sys.stdout = Tee(log_file)

load_dotenv()
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SECRET")
supabase = create_client(url, key)

count_response = supabase.table("sites_detail_fnr_test")\
    .select("*", count="exact")\
    .execute()
total = count_response.count
print(f"Total records: {total}")

rows = []
page_size = 1000
offset = 0

while True:
    batch = supabase.table("sites_detail_fnr_test")\
        .select("*")\
        .order("inspectdate", desc=False)\
        .range(offset, offset + page_size - 1)\
        .execute()
    if not batch.data:
        break
    rows.extend(batch.data)
    print(f"Fetched {len(rows)} / {total} records...")
    offset += page_size
    if len(batch.data) < page_size:
        break

print(f"Total fetched: {len(rows)}")

# Regex to match question codes like Q82_FinalComm or Q41-1_DurComm
QUESTION_CODE_PATTERN = re.compile(r'(Q\d+(?:-\d+)?_\w+)\s*:')
count = 1
for i in rows:
    try:
        print("RECORD: ", count)
        count += 1
        if not i:
            continue

        notes_text = i['notes']
        sitename = i['namesite']
        inspectdate = i['inspectdate']
        inspectno = i['inspectno']

        naturalness_details = i['naturalness_details']
        naturalness_score = i['naturalness_score']

        match_sitename = supabase.table("W26_sites-pa").select("*").eq("namesite", sitename).execute()
        if not match_sitename.data:
            print(f"No site found for: {sitename}, skipping.")
            continue

        site_id = match_sitename.data[0]['id']

        print()
        print("Name: ", sitename)
        print(site_id)
        print("Date: ", inspectdate)

        # --- Insert into W26_form_responses (upsert to avoid duplicates on re-run) ---
        
        response_insert = supabase.table("W26_form_responses").upsert({
            "site_id": site_id,
            "user_id": None,
            "inspection_no": inspectno,
            "created_at": inspectdate,
        }, on_conflict="inspection_no").execute()

        response_id = response_insert.data[0]['id']
        print("form_response id: ", response_id)

        match_other_stuff = supabase.table("vw_inspect_all").select("q02_whatreport", "q03_fineprint", "email-inspect", "steward", "steward-guest", "steward-phone", "q16-sapaa-member", "q22-pasitename", "q23-pasite-parcel", "steward-type").eq("inspectno", inspectno).execute()
        match_other_stuff = match_other_stuff.data[0] if match_other_stuff.data else None
        
        if match_other_stuff:
            if match_other_stuff["email-inspect"]: 
                supabase.table("W26_answers").insert({
                    "response_id": response_id,
                    "question_id": 32,
                    "obs_value": None,
                    "obs_comm": match_other_stuff["email-inspect"],
                }).execute()
            
            if match_other_stuff["steward"]:
                supabase.table("W26_answers").insert({
                    "response_id": response_id,
                    "question_id": 33,
                    "obs_value": match_other_stuff["steward"],
                    "obs_comm": None,
                }).execute()
            
            if match_other_stuff["steward-guest"]: 
                supabase.table("W26_answers").insert({
                    "response_id": response_id,
                    "question_id": 34,
                    "obs_value": None,
                    "obs_comm": match_other_stuff["steward-guest"],
                }).execute()
                
            if match_other_stuff["steward-phone"]:
                supabase.table("W26_answers").insert({
                    "response_id": response_id,
                    "question_id": 35,
                    "obs_value": None,
                    "obs_comm": match_other_stuff["steward-phone"],
                }).execute()
            
            if match_other_stuff["q16-sapaa-member"]:
                supabase.table("W26_answers").insert({
                    "response_id": response_id,
                    "question_id": 36,
                    "obs_value": match_other_stuff["q16-sapaa-member"],
                    "obs_comm": None,
                }).execute()
            
            if match_other_stuff["q22-pasitename"]:
                supabase.table("W26_answers").insert({
                    "response_id": response_id,
                    "question_id": 38,
                    "obs_value": match_other_stuff["q22-pasitename"],
                    "obs_comm": None,
                }).execute()
            
            if match_other_stuff["q23-pasite-parcel"]:
                supabase.table("W26_answers").insert({
                    "response_id": response_id,
                    "question_id": 47,
                    "obs_value": None,
                    "obs_comm": match_other_stuff["q23-pasite-parcel"],
                }).execute()
                
            if match_other_stuff["steward-type"]:
                supabase.table("W26_answers").insert({
                    "response_id": response_id,
                    "question_id": 39,
                    "obs_value": match_other_stuff["steward-type"],
                    "obs_comm": None,
                }).execute()
        
        if naturalness_score:
            supabase.table("W26_answers").insert({
                "response_id": response_id,
                "question_id": 1,
                "obs_value": naturalness_score,
                "obs_comm": None,
            }).execute()

            if naturalness_details:
                supabase.table("W26_answers").insert({
                    "response_id": response_id,
                    "question_id": 2,
                    "obs_value": None,
                    "obs_comm": naturalness_details,
                }).execute()
        
        print()
        print("Notes: ")

        # Split by question code pattern, keeping the codes as delimiters
        parts = QUESTION_CODE_PATTERN.split(notes_text)
        
        # parts will be: ['', 'Q82_FinalComm', ' Slight traffic...', 'Q71_Remediate', ' Signage; ...', ...]
        # Skip the first empty string, then iterate in pairs: (code, answer)
        pairs = list(zip(parts[1::2], parts[2::2]))

        for question_code, answer in pairs:
            question_code = question_code.strip()
            answer = answer.strip().strip(';').strip()

            match = supabase.table("W26_questions").select("*").eq("question key", question_code).execute()

            if not match.data:
                print(f"NO MATCH for: {question_code}")
                continue

            q = match.data[0]
            question_id = q['id']
            print(f"{q['form_question']}, {question_id}, {q['obs_value']}, {q['obs_comm']}")

            selected_options = []
            valid_options = []
            other_text = ""
            obs_value_out = None
            obs_comm_out = None
            other = False

            if q['obs_value'] and answer:
                # Fetch known valid options for this question
                options_match = supabase.table("W26_question_options")\
                    .select("option_text")\
                    .eq("question_id", question_id)\
                    .execute()
                
                valid_options = [o['option_text'] for o in options_match.data]
                
                # Try to match known options against the answer string
                remaining = answer
                for opt in valid_options:
                    if opt in remaining:
                        selected_options.append(opt)
                        remaining = remaining.replace(opt, "").strip().strip(';').strip(',').strip()

                # Whatever is left is free-text "Other"
                other_text = remaining.strip().strip(';').strip(',').strip()

                # Collapse leftover empty segments from removed options
                other_text = "; ".join(
                    part.strip() for part in other_text.split(";") if part.strip()
                )

                if other_text in ("", "Not Applicable"):
                    other_text = ""

                obs_value_out = "; ".join(selected_options) if selected_options else None
                
                obs_comm_out = other_text if other_text else None

            if q['obs_comm'] and answer:
                obs_comm_out = answer

            print(f"Answer: {answer}")
            print(f"Valid options: {valid_options}")
            print(f"Selected options: {selected_options}")
            if other_text:
                print(f"Other (free text): {other_text}")
            if q['obs_comm'] and answer:
                print(f"Comment: {answer}")
            print()

            # --- Insert into W26_answers ---
            if obs_value_out:
                if selected_options:
                    for option in selected_options:
                        supabase.table("W26_answers").insert({
                            "response_id": response_id,
                            "question_id": question_id,
                            "obs_value": option,
                            "obs_comm": None,  
                        }).execute()
            
            if obs_comm_out:
                if other_text: 
                    supabase.table("W26_answers").insert({
                        "response_id": response_id,
                        "question_id": question_id,
                        "obs_value": "Other",
                        "obs_comm": obs_comm_out,  
                    }).execute()
                else:
                    supabase.table("W26_answers").insert({
                        "response_id": response_id,
                        "question_id": question_id,
                        "obs_value": obs_value_out,
                        "obs_comm": obs_comm_out,  
                    }).execute()
            
            if obs_value_out is None and obs_comm_out is None:
                supabase.table("W26_answers").insert({
                    "response_id": response_id,
                    "question_id": question_id,
                    "obs_value": obs_value_out,
                    "obs_comm": obs_comm_out,
                }).execute()
    
    except Exception as e:
        print(f"ERROR on record {inspectno}: {e}")
        continue

log_file.close()