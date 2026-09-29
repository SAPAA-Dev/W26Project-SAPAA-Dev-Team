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
      + '<a onclick="signOut()">Sign Out</a>';
  } else {
    el.innerHTML = 'Not signed in (browsing as guest Steward view)'
      + '<span style="flex:1"></span>'
      + '<a href="profile.html">Profile</a>'
      + '<a href="signin.html">Sign In</a>';
  }
  // Prototype note: role gating happens INSIDE the app (menu items, buttons),
  // never at a separate login page. See signin.html.
  document.querySelectorAll('.admin-only').forEach(function(n){
    n.style.display = getRole()==='admin' ? '' : 'none';
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
function initTagInput(containerId, initialTags){
  var box = document.getElementById(containerId);
  var tags = initialTags.slice();
  function render(){
    box.querySelectorAll('.tag-chip').forEach(function(c){ c.remove(); });
    var input = box.querySelector('.tag-input-row');
    tags.forEach(function(t){
      var chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = t + ' ';
      var x = document.createElement('button');
      x.textContent = '\u00d7';
      x.onclick = function(){ tags = tags.filter(function(tt){return tt!==t;}); render(); };
      chip.appendChild(x);
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
// see the list of pages at the bottom of this section. Sourced from index.md.
// Set `id`/`pts` to null for anything that isn't a numbered project story yet.
// =====================================================================================
var STORIES = {
  home: {
    label: 'Home',
    items: [
      { id:null, pts:null, text:"As a user, I want a home dashboard with key site counts and a searchable, browsable site list, so that I can quickly find a Site and jump into its report or the map." }
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
      { id:'US 2.0.8', pts:3, text:"The detail view opens the same whether I arrive from the map or the home list, and shows the same name, county and last-inspected date either way." },
      { id:'US 2.0.9', pts:5, text:"As a Steward, I want to upload the GPX file my device recorded during a visit, so the visit is logged and the next steward can see which part of the Site was already covered." },
      { id:'US 2.0.10', pts:1, text:"As a Steward, I want links to the SAPAA website and iNaturalist from a site page, so I can quickly learn more (opens in a new tab, not my current one)." },
      { id:'US 4.0.4', pts:5, text:"As a Steward, I want to edit my own previous inspections, so I can fix incorrectly submitted entries — but I shouldn't be able to edit anyone else's." },
      { id:'US 7.0.1', pts:2, text:"As a Steward, I want to export my own SIR as a PDF, so I can keep or share a copy of my report." },
      { id:'US 7.0.4', pts:5, text:"As a Steward, I want to pick one question and see how its answers changed over the years at a Site, so I can see what's getting better or worse." }
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
      { id:'US 1.0.4', pts:2, text:"As a Steward, I want quick aggregate stats (SIR count, sites inspected) on a profile, so I get an overview of their activity at a glance." }
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
      { id:'US 6.0.1', pts:5, text:"As a Steward, I want each Site stored with its real boundary from the same source the SAPAA website uses, so the app and website never disagree about a Site's shape — see the missing-geometry banner." }
    ]
  },
  'admin-inspections': {
    label:'Admin: All Inspections',
    items:[
      { id:'US 7.0.3', pts:5, text:"As an Admin, I want a summary across all SIRs — counts per Site/steward/reason, plus the spread of naturalness scores — recalculated for a chosen date range, so I can report on all Sites at once." }
    ]
  },
  signin: {
    label:'Sign In',
    items:[
      { id:null, pts:null, text:"v1.1 UX polish: sign-in is the same single flow for everyone, no matter their role. Role only changes what shows up once you're inside the app (the Admin section of the menu, edit permissions, etc.) — never a separate login page." },
      { id:'US 5.0.4', pts:2, text:"As a User, I want signing out to keep me signed out, so the next person on a shared device can't use my account." }
    ]
  },
  'reset-password': {
    label:'Reset Password',
    items:[
      { id:'US 5.0.2', pts:2, text:"As a User, I want to reset my password myself (email → verification code → new password), so I don't need an Admin to get me back in." }
    ]
  }
};

function renderStories(){
  var stage = document.querySelector('.stage');
  if(!stage || document.getElementById('storiesPanel')) return;
  var current = document.body.getAttribute('data-page');
  var html = '<h2>User Stories</h2>'
    + '<p class="hint">From the project\u2019s user stories (index.md). Edit the <code>STORIES</code> object at the top of app.js to change this panel \u2014 the block for the page you\u2019re on highlights automatically.</p>';
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
  if(match){ setTimeout(function(){ match.scrollIntoView({block:'nearest'}); }, 50); }
}

document.addEventListener('DOMContentLoaded', function(){
  renderAccountBar();
  renderStories();
});
