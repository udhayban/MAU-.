const venues = [
  { id: "auditorium", name: "Main Auditorium", capacity: 500, type: "Indoor", features: "Stage • Projector • A/V" },
  { id: "seminar", name: "Seminar Hall", capacity: 150, type: "Indoor", features: "Projector • AC • Mic" },
  { id: "ground1", name: "Ground 1", capacity: 1000, type: "Outdoor", features: "Sports • Large Events" },
  { id: "ground2", name: "Ground 2", capacity: 700, type: "Outdoor", features: "Sports • Cultural Events" },
  { id: "ground3", name: "Ground 3", capacity: 450, type: "Outdoor", features: "Games • Activities" },
  { id: "lab", name: "Computer Lab", capacity: 80, type: "Indoor", features: "60 PCs • Internet • Projector" },
  { id: "avroom", name: "A/V Room", capacity: 60, type: "Indoor", features: "Smart Display • Audio" }
];

const demoBookings = [
  { id: 1, event: "Engineer’s Day Inauguration", organizer: "CSE Department", venue: "auditorium", audience: 420, date: getDateOffset(0), start: "10:00", end: "12:00", type: "Technical", status: "Approved" },
  { id: 2, event: "Robotics Showcase", organizer: "Innovation Cell", venue: "seminar", audience: 120, date: getDateOffset(0), start: "11:00", end: "13:00", type: "Technical", status: "Approved" },
  { id: 3, event: "Football Practice", organizer: "Sports Committee", venue: "ground1", audience: 90, date: getDateOffset(0), start: "15:00", end: "17:00", type: "Sports", status: "Approved" },
  { id: 4, event: "Alumni Interaction", organizer: "Placement Cell", venue: "auditorium", audience: 300, date: getDateOffset(1), start: "13:00", end: "15:00", type: "Meeting", status: "Pending" }
];

let conflictCount = Number(localStorage.getItem("cf_conflicts") || 0);
let bookings = JSON.parse(localStorage.getItem("cf_bookings") || "null") || demoBookings;

function getDateOffset(offset){
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function save(){
  localStorage.setItem("cf_bookings", JSON.stringify(bookings));
  localStorage.setItem("cf_conflicts", String(conflictCount));
}

function venueName(id){
  return venues.find(v=>v.id===id)?.name || id;
}

function overlaps(aStart,aEnd,bStart,bEnd){
  return aStart < bEnd && aEnd > bStart;
}

function hasConflict(venue,date,start,end,ignoreId=null){
  return bookings.some(b =>
    b.id !== ignoreId &&
    b.status !== "Cancelled" &&
    b.venue === venue &&
    b.date === date &&
    overlaps(start,end,b.start,b.end)
  );
}

function formatDate(value){
  return new Date(value+"T00:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"});
}

function renderAll(){
  renderStats();
  renderVenues();
  renderUpcoming();
  renderSchedule();
  renderAdmin();
}

function renderStats(){
  const today = getDateOffset(0);
  document.getElementById("venueCount").textContent = venues.length;
  document.getElementById("todayCount").textContent = bookings.filter(b=>b.date===today && b.status!=="Cancelled").length;
  document.getElementById("pendingCount").textContent = bookings.filter(b=>b.status==="Pending").length;
  document.getElementById("conflictCount").textContent = conflictCount;
  document.getElementById("approvedCount").textContent = bookings.filter(b=>b.status==="Approved").length;
  document.getElementById("adminPendingCount").textContent = bookings.filter(b=>b.status==="Pending").length;
  document.getElementById("cancelledCount").textContent = bookings.filter(b=>b.status==="Cancelled").length;
}

function renderVenues(){
  const box = document.getElementById("venueCards");
  const today = getDateOffset(0);
  const now = new Date().toTimeString().slice(0,5);
  box.innerHTML = venues.map(v=>{
    const busy = bookings.some(b=>b.venue===v.id && b.date===today && b.status!=="Cancelled" && b.start<=now && b.end>now);
    return `<div class="venue-card">
      <div class="row"><div><div class="venue-name">${v.name}</div><div class="venue-meta">${v.type} • Capacity ${v.capacity}</div></div><span class="status-dot ${busy?"busy":"free"}"></span></div>
      <div class="venue-meta">${v.features}</div>
      <div class="venue-meta" style="margin-top:10px;color:${busy?"#ffc857":"#6ce5b1"}">${busy?"Currently occupied":"Available now"}</div>
    </div>`;
  }).join("");
}

function renderUpcoming(){
  const list = [...bookings]
    .filter(b=>b.status!=="Cancelled")
    .sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start))
    .slice(0,5);
  document.getElementById("upcomingList").innerHTML = list.length ? list.map(b=>`
    <div class="booking-item">
      <strong>${b.event}</strong>
      <span>${venueName(b.venue)} • ${formatDate(b.date)} • ${b.start}–${b.end}</span>
    </div>`).join("") : `<div class="booking-item"><span>No bookings found.</span></div>`;
}

function renderSchedule(){
  const q = document.getElementById("scheduleSearch").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const rows = bookings
    .filter(b => status==="all" || b.status===status)
    .filter(b => [b.event,b.organizer,venueName(b.venue)].join(" ").toLowerCase().includes(q))
    .sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));

  document.getElementById("scheduleBody").innerHTML = rows.map(b=>`
    <tr>
      <td><strong>${b.event}</strong><br><span style="color:#72839b;font-size:11px">${b.type}</span></td>
      <td>${venueName(b.venue)}</td>
      <td>${formatDate(b.date)}</td>
      <td>${b.start}–${b.end}</td>
      <td>${b.organizer}</td>
      <td><span class="badge ${b.status}">${b.status}</span></td>
    </tr>`).join("") || `<tr><td colspan="6">No matching bookings.</td></tr>`;
}

function renderAdmin(){
  const rows = [...bookings].sort((a,b)=>(a.status==="Pending"?-1:1));
  document.getElementById("adminBody").innerHTML = rows.map(b=>`
    <tr>
      <td><strong>${b.event}</strong><br><span style="color:#72839b;font-size:11px">${b.organizer}</span></td>
      <td>${venueName(b.venue)}</td>
      <td>${formatDate(b.date)}<br>${b.start}–${b.end}</td>
      <td>${b.audience}</td>
      <td><span class="badge ${b.status}">${b.status}</span></td>
      <td>
        ${b.status==="Pending" ? `<button class="action-btn approve" onclick="updateStatus(${b.id},'Approved')">Approve</button>` : ""}
        ${b.status!=="Cancelled" ? `<button class="action-btn cancel" onclick="updateStatus(${b.id},'Cancelled')">Cancel</button>` : ""}
      </td>
    </tr>`).join("");
}

window.updateStatus = function(id,status){
  const item = bookings.find(b=>b.id===id);
  if(!item) return;
  if(status==="Approved" && hasConflict(item.venue,item.date,item.start,item.end,item.id)){
    toast("Cannot approve: another active booking overlaps this slot.");
    return;
  }
  item.status=status;
  save();
  renderAll();
  toast(`Request ${status.toLowerCase()} successfully.`);
}

function findAlternatives(selectedVenue,date,start,end,audience){
  const sameTimeVenues = venues
    .filter(v=>v.id!==selectedVenue && v.capacity>=audience && !hasConflict(v.id,date,start,end))
    .slice(0,3);

  const duration = toMinutes(end)-toMinutes(start);
  let nearbySlot = null;
  for(let delta=30; delta<=240; delta+=30){
    const candidateStart = toMinutes(start)+delta;
    const candidateEnd = candidateStart+duration;
    if(candidateEnd <= 22*60){
      const s=fromMinutes(candidateStart), e=fromMinutes(candidateEnd);
      if(!hasConflict(selectedVenue,date,s,e)){ nearbySlot={start:s,end:e}; break; }
    }
  }
  return {sameTimeVenues, nearbySlot};
}

function toMinutes(t){ const [h,m]=t.split(":").map(Number); return h*60+m; }
function fromMinutes(n){ return `${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`; }

document.getElementById("bookingForm").addEventListener("submit", e=>{
  e.preventDefault();
  const event = document.getElementById("eventName").value.trim();
  const organizer = document.getElementById("organizer").value.trim();
  const venue = document.getElementById("venue").value;
  const audience = Number(document.getElementById("audience").value);
  const date = document.getElementById("date").value;
  const start = document.getElementById("startTime").value;
  const end = document.getElementById("endTime").value;
  const type = document.getElementById("eventType").value;
  const result = document.getElementById("bookingResult");
  const selected = venues.find(v=>v.id===venue);

  if(end<=start){
    result.className="result-box bad";
    result.innerHTML="<strong>Invalid time:</strong> End time must be after start time.";
    return;
  }
  if(audience>selected.capacity){
    result.className="result-box bad";
    result.innerHTML=`<strong>Capacity issue:</strong> ${selected.name} supports ${selected.capacity} people, but your request is for ${audience}.`;
    return;
  }

  if(hasConflict(venue,date,start,end)){
    conflictCount++;
    save();
    renderStats();
    const alt=findAlternatives(venue,date,start,end,audience);
    const venueText=alt.sameTimeVenues.length
      ? alt.sameTimeVenues.map(v=>v.name).join(", ")
      : "No capacity-matched venue is free at the same time";
    const slotText=alt.nearbySlot
      ? `${alt.nearbySlot.start}–${alt.nearbySlot.end} in ${selected.name}`
      : "No nearby slot found within 4 hours";
    result.className="result-box bad";
    result.innerHTML=`<strong>Conflict detected.</strong><br><br>
      Same-time alternatives: <strong>${venueText}</strong><br>
      Nearest slot: <strong>${slotText}</strong>`;
    toast("Booking conflict detected — alternatives generated.");
    return;
  }

  bookings.push({
    id: Date.now(), event, organizer, venue, audience, date, start, end, type, status:"Pending"
  });
  save();
  renderAll();
  result.className="result-box good";
  result.innerHTML=`<strong>Slot available!</strong> Request submitted to the admin dashboard for approval.`;
  e.target.reset();
  document.getElementById("date").value=getDateOffset(0);
  toast("Booking request submitted.");
});

function setupNav(){
  document.querySelectorAll(".nav-link").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".nav-link").forEach(x=>x.classList.remove("active"));
      document.querySelectorAll(".page-section").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.target).classList.add("active");
    });
  });
  document.querySelectorAll(".jump-booking").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelector('[data-target="booking"]').click();
  }));
}

function toast(msg){
  const el=document.getElementById("toast");
  el.textContent=msg; el.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer=setTimeout(()=>el.classList.remove("show"),2600);
}

document.getElementById("resetDemo").addEventListener("click",()=>{
  localStorage.removeItem("cf_bookings");
  localStorage.removeItem("cf_conflicts");
  bookings=JSON.parse(JSON.stringify(demoBookings));
  conflictCount=0;
  save(); renderAll(); toast("Demo data reset.");
});

document.getElementById("scheduleSearch").addEventListener("input",renderSchedule);
document.getElementById("statusFilter").addEventListener("change",renderSchedule);

document.getElementById("venue").innerHTML = venues.map(v=>`<option value="${v.id}">${v.name} — Capacity ${v.capacity}</option>`).join("");
document.getElementById("date").value=getDateOffset(0);
setupNav();
renderAll();
