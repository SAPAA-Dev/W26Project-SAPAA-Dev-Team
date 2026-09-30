// ---- session/role state (localStorage-backed, never blocks navigation) ----
function getSignedIn(){ return localStorage.getItem('sapaa_signed_in') === '1'; }
function getRole(){ return localStorage.getItem('sapaa_role') || 'steward'; }
function getUserName(){ return localStorage.getItem('sapaa_name') || (getRole()==='admin' ? 'Alex Morgan (Admin)' : 'Jamie Rivera'); }
function signIn(role){
  localStorage.setItem('sapaa_signed_in','1');
  localStorage.setItem('sapaa_role', role);
  localStorage.setItem('sapaa_name', role==='admin' ? 'Alex Morgan (Admin)' : 'Jamie Rivera');
}
function signOut(){
  localStorage.setItem('sapaa_signed_in','0');
  window.location.href = 'home.html';
}
function switchRole(){
  signIn(getRole()==='admin' ? 'steward' : 'admin');
  window.location.reload();
}

function renderAccountBar(){
  var el = document.getElementById('accountBar');
  if(!el) return;
  if(getSignedIn()){
    el.innerHTML = 'Signed in as <a href="profile.html">'+getUserName()+'</a> ('+getRole()+')'
      + '<span style="flex:1"></span>'
      + '<a onclick="switchRole()">Switch to '+(getRole()==='admin'?'Steward':'Admin')+' view</a>'
      + '<a onclick="signOut()">Sign Out</a><span class="us">US 5.0.4</span>';
  } else {
    el.innerHTML = 'Not signed in (prototype shows the Steward view)'
      + '<span style="flex:1"></span>'
      + '<a href="profile.html">Profile</a>'
      + '<a href="signin.html">Sign In</a>';
  }
  // Prototype note: role gating happens INSIDE the app (menu items, buttons),
  // never at a separate login page. See signin.html.
  var isAdmin = getSignedIn() && getRole()==='admin';
  document.querySelectorAll('.admin-only').forEach(function(n){
    n.style.display = isAdmin ? '' : 'none';
  });
}

// ---- generic dropdown menu (Home/Menu header) ----
function toggleMenu(e){
  e.stopPropagation();
  document.getElementById('navMenu').classList.toggle('show');
}
function closeMenus(){
  var m = document.getElementById('navMenu');
  if(m) m.classList.remove('show');
}
document.addEventListener('click', function(){
  closeMenus();
  document.querySelectorAll('.filter-dd.show').forEach(function(d){ d.classList.remove('show'); });
});

function toggleSection(id){ var f=document.getElementById(id); f.style.display = f.style.display==='none' ? 'block' : 'none'; }

// ---- toast ----
function showToast(msg){
  var t=document.getElementById('toast'); if(!t) return;
  t.textContent=msg; t.style.display='block';
  clearTimeout(window._tt); window._tt=setTimeout(function(){ t.style.display='none'; }, 1900);
}

// ---- confirm modal (generic, reused for Delete Site / Delete Image etc.) ----
function openConfirm(message, onYes){
  var overlay = document.getElementById('confirmOverlay');
  document.getElementById('confirmMessage').textContent = message;
  overlay.classList.add('show');
  window._confirmYes = onYes;
}
function closeConfirm(){ document.getElementById('confirmOverlay').classList.remove('show'); }
function confirmYes(){ closeConfirm(); if(window._confirmYes) window._confirmYes(); }

// ---- required-field validation helper ----
function validateRequired(ids){
  var ok = true;
  ids.forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    if(!el.value || !el.value.trim()){ el.classList.add('error'); ok = false; }
    else{ el.classList.remove('error'); }
  });
  return ok;
}

// ---- simple tag chip input, used on profile.html ----
function initTagInput(containerId, initialTags, readOnly){
  var box = document.getElementById(containerId);
  var tags = initialTags.slice();
  function render(){
    box.querySelectorAll('.tag-chip').forEach(function(c){ c.remove(); });
    var input = box.querySelector('.tag-input-row');
    tags.forEach(function(t){
      var chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = t + ' ';
      if(!readOnly){
        var x = document.createElement('button');
        x.textContent = '\u00d7';
        x.onclick = function(){ tags = tags.filter(function(tt){return tt!==t;}); render(); };
        chip.appendChild(x);
      }
      box.insertBefore(chip, input);
    });
  }
  window['addTag_'+containerId] = function(){
    var inp = document.getElementById(containerId+'_input');
    var v = inp.value.trim();
    if(v && tags.indexOf(v)===-1){ tags.push(v); inp.value=''; render(); }
  };
  render();
}

// =====================================================================================
// USER STORIES — this is the ONE place to edit. The panel beside the screen on every
// page is built from this object. Keys must match each page's <body data-page="..."> —
// see the list of pages at the bottom of this section. Sourced from docs/user-stories.md.
// Set `id`/`pts` to null for anything that isn't a numbered project story yet.
// =====================================================================================
var STORIES = {
  home: {
    label: 'Home',
    items: [
      { id:null, pts:null, text:"Entry page. A site card opens the Site Report (US 2.0.8). 'View Map' opens the Site Map (US 2.0.1)." },
      { id:'US 5.0.4', pts:2, text:"As a User, I want signing out to keep me signed out, so the next person on a shared device can't use my account. 'Sign Out' in the top bar and 'Logout' in the Menu are on each signed-in screen. Both open Home." }
    ]
  },
  map: {
    label: 'Site Map',
    items: [
      { id:'US 2.0.1', pts:8, text:"As a Steward, I want a map that shows where a natural area is, whether it's been visited, and what other stewards have done there, so that I know what to expect on my next visit." },
      { id:'US 2.0.6', pts:5, text:"As a Steward, I want to search and filter Sites on the map by county, so that I can easily find the Site I'm looking for." },
      { id:'US 2.0.8', pts:3, text:"As a Steward, I want to see a Site's details by selecting it on the map, so that I can gather context while exploring." },
      { id:'US 4.0.2', pts:13, text:"As a Steward, I want offline/online map layers, so that I can navigate complex areas — downloaded tiles should keep working with no connectivity." }
    ]
  },
  report: {
    label: 'Site Report',
    items: [
      { id:'US 1.0.1', pts:5, text:"Select a steward name in the table to open the read-only profile of that steward." },
      { id:'US 2.0.8', pts:3, text:"The detail view opens the same whether I arrive from the map or the home list, and shows the same name, county and last-inspected date either way." },
      { id:'US 2.0.9', pts:5, text:"As a Steward, I want to upload the GPX file my device recorded during a visit, so the visit is logged and the next steward can see which part of the Site was already covered." },
      { id:'US 2.0.10', pts:1, text:"As a Steward, I want links to the SAPAA website and iNaturalist from a site page, so I can quickly learn more. Each link opens in a new window, not in my current window." },
      { id:'US 2.0.11', pts:5, text:"As a Steward, I want to see the nearest hospital, the known hazards, and other safety information for a Site, so that I can prepare for an emergency. An empty value shows as 'Not recorded'. Only an Admin can change the values." },
      { id:'US 2.0.12', pts:8, text:"As an Admin, I want to give a Site points for abuses, biological imperatives, and time since the last visit, and combine them into one to-visit priority. This screen shows the priority and the three scores to all users. The Admin enters the points on Admin: Sites." },
      { id:'US 3.0.2', pts:5, text:"As an Admin, I want to assign an individual for a site, so that other stewards can reach out to them for more information. This screen shows the assigned steward. The assign control is not drawn yet." },
      { id:'US 4.0.4', pts:5, text:"As a Steward, I want to edit my own previous inspections, so I can fix incorrectly submitted entries — but I shouldn't be able to edit anyone else's." },
      { id:'US 4.0.5', pts:5, text:"As a Steward, I want to add the photos that I took on iNaturalist to my SIR, so that I do not upload them a second time. The Photo Identifier fills in from the iNaturalist observation. Open 'New Inspection Report' to see it." },
      { id:'US 4.0.6', pts:1, text:"As a Steward, I want to leave the Photo Identifier field empty, so that I do not repeat my description. The field shows '(optional)' and has no 'required' note." },
      { id:'US 4.0.7', pts:5, text:"As a Steward, I want to see up to the top 5 iNaturalist observations for a Site, so that I get more information without an iNaturalist account. The observations with the most engagement show first." },
      { id:'US 7.0.1', pts:2, text:"As a Steward, I want to export my own SIR as a PDF, so I can keep or share a copy of my report." },
      { id:'US 7.0.4', pts:5, text:"As a Steward, I want to pick one question and see how its answers changed over the years at a Site, so I can see what's getting better or worse. Won't Have: the team does not plan to build this story." }
    ]
  },
  gallery: {
    label:'Image Gallery',
    items:[
      { id:'US 7.0.5', pts:5, text:"As an Admin, I want deleting an image to remove it from view and delete the stored file, so inaccurate images stop showing and stop costing storage money. Stewards should never see a delete control." }
    ]
  },
  profile: {
    label:'Profile',
    items:[
      { id:'US 1.0.1', pts:5, text:"As a Steward, I want to view my own profile and other stewards' profiles — skills, focus areas, contact info, SIR count — so I can judge credibility and know who to ask about a topic." },
      { id:'US 1.0.2', pts:3, text:"As a Steward, I want to edit my own profile only (skills, focus areas included), so my details stay up to date." },
      { id:'US 1.0.3', pts:2, text:"As a Steward, I want to see a steward's past inspections (site + date) on their profile and open one, so I know their level of experience." },
      { id:'US 1.0.4', pts:2, text:"As a Steward, I want quick aggregate stats (SIR count, sites inspected) on a profile, so I get an overview of their activity at a glance." },
      { id:'US 1.0.5', pts:5, text:"As a Steward, I want to earn points for visiting Sites, contributing photos, and other inspection activity, so that I have a reason to visit more natural areas. My own profile shows my current total." },
      { id:'US 3.0.2', pts:5, text:"As an Admin, I want to assign an individual for a site, so that other stewards can reach out to them for more information. This screen shows the assigned site of the steward." }
    ]
  },
  'admin-dashboard': {
    label:'Admin Dashboard',
    items:[
      { id:null, pts:null, text:"Executive summary: the Admin is the primary user and needs a reliable system that eliminates manual data handling while keeping access to the data, report generation, and distribution." },
      { id:'US 7.0.3', pts:5, text:"As an Admin, I want a summary across all SIRs rather than one Site at a time, so I can report on the state of all Sites at once — see All Inspections." }
    ]
  },
  'admin-sites': {
    label:'Admin: Sites',
    items:[
      { id:'US 2.0.2', pts:3, text:"As an Admin, I want to add a new Site through the app UI, so I'm not limited to direct database inserts — and warn me if a similarly-named Site already exists." },
      { id:'US 2.0.5', pts:5, text:"As an Admin, I want to update an existing Site's page fields, so I can direct stewards to more information." },
      { id:'US 2.0.3', pts:3, text:"As an Admin, I want to deactivate/reactivate a Site, so I can toggle its visibility everywhere it's listed — its inspection history should stay viewable either way." },
      { id:'US 2.0.4', pts:8, text:"As an Admin, I want to delete a Site, so I can remove incorrect or duplicate info — with a confirmation naming how many linked inspections/images will be removed, since it can't be undone." },
      { id:'US 6.0.1', pts:5, text:"As a Steward, I want each Site stored with its real boundary from the same source the SAPAA website uses, so the app and website never disagree about a Site's shape — see the missing-geometry banner." },
      { id:'US 2.0.12', pts:8, text:"As an Admin, I want to give a Site points for abuses, biological imperatives, and time since the last visit, so that the app can calculate one to-visit priority. Select 'Priority' on a site card." },
      { id:'US 2.0.13', pts:3, text:"As an Admin, I want a reminder when the priority points of a Site are more than one year old, so that I reassess them. Saving new points removes the reminder." },
      { id:'US 3.0.3', pts:8, text:"As an Admin, I want to export all images and other digital files at once as one .zip file, so that I can back them up. Select 'Export'." },
      { id:'US 7.0.6', pts:5, text:"As an Admin, I want to export more than 50 SIRs at once, so that I can back them up faster. Select 'Bulk PDF'." },
      { id:'US 7.0.7', pts:5, text:"As an Admin, I want to select SIR fields to hide before export, so that confidential fields stay out of the export. If I select no fields, the export has the full SIR. This is step 2 of 'Bulk PDF'." }
    ]
  },
  'admin-inspections': {
    label:'Admin: All Inspections',
    items:[
      { id:'US 7.0.3', pts:5, text:"As an Admin, I want a summary across all SIRs — counts per Site/steward/reason, plus the spread of naturalness scores — recalculated for a chosen date range, so I can report on all Sites at once." },
      { id:'US 7.0.8', pts:5, text:"As an Admin, I want to delete a SIR, so that I can remove a report that is out of date or inaccurate. I must confirm before the report is removed." }
    ]
  },
  signin: {
    label:'Sign In',
    items:[
      { id:'US 5.0.2', pts:2, text:"As a User, I want to reset my password myself, so I don't need an Admin to get me back in. Select 'Forgot password?' to start." }
    ]
  },
  'reset-password': {
    label:'Reset Password',
    items:[
      { id:'US 5.0.2', pts:2, text:"As a User, I want to reset my password myself (email → verification code → new password), so I don't need an Admin to get me back in." }
    ]
  },
  'no-screen': {
    label: "No screen (Won't Have)",
    items: [
      { id:'US 7.0.9', pts:5, text:"Record Audio During a Site Inspection. Won't Have: the team does not plan to build this story, so it has no screen." }
    ]
  }
};

function renderStories(){
  var stage = document.querySelector('.stage');
  if(!stage || document.getElementById('storiesPanel')) return;
  var current = document.body.getAttribute('data-page');
  var html = '<h2>User Stories</h2>'
    + '<p class="hint">From the project\u2019s user stories (docs/user-stories.md). Edit the <code>STORIES</code> object at the top of app.js to change this panel \u2014 the block for the page you\u2019re on highlights automatically.</p>';
  Object.keys(STORIES).forEach(function(key){
    var group = STORIES[key];
    var isCurrent = key === current;
    html += '<div class="story-block"'+(isCurrent?' data-current="true"':'')+'><h3>'+group.label+'</h3>';
    group.items.forEach(function(item){
      html += '<div class="story-item">'
        + (item.id ? '<span class="story-id">'+item.id+(item.pts?' \u00b7 '+item.pts+' pts':'')+'</span>' : '')
        + '<p>'+item.text+'</p></div>';
    });
    html += '</div>';
  });
  var aside = document.createElement('aside');
  aside.className = 'stories';
  aside.id = 'storiesPanel';
  aside.innerHTML = html;
  stage.appendChild(aside);
  var match = aside.querySelector('.story-block[data-current="true"]');
  // scrollIntoView would also scroll the window and hide the screen when the panel wraps below it.
  if(match){ aside.scrollTop = match.offsetTop - aside.offsetTop; }
}

document.addEventListener('DOMContentLoaded', function(){
  renderAccountBar();
  renderStories();
});
