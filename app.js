let videos = [];
let current = null;

const $ = id => document.getElementById(id);

async function loadVideos(){
  const res = await fetch("/api/videos");
  videos = await res.json();
  render();
}
function formatSize(n){
  if(n < 1024*1024) return (n/1024).toFixed(0)+" KB";
  return (n/1024/1024).toFixed(1)+" MB";
}
function render(){
  const q = $("search").value.toLowerCase().trim();
  const list = videos.filter(v => (v.title+" "+v.description).toLowerCase().includes(q));
  $("count").textContent = `${list.length} वीडियो`;
  $("empty").hidden = list.length !== 0;
  $("grid").innerHTML = list.map(v => `
    <article class="card">
      <div class="thumb" onclick="openPlayer('${v.id}')">▶</div>
      <div class="cardBody">
        <h3 title="${escapeHtml(v.title)}">${escapeHtml(v.title)}</h3>
        <p>${escapeHtml(v.description || "वीडियो")} · ${formatSize(v.size)}</p>
        <div class="cardActions">
          <button class="smallBtn" onclick="openPlayer('${v.id}')">▶ देखें</button>
          <a class="smallBtn" href="${v.url}" download>⬇ डाउनलोड</a>
          <button class="smallBtn" onclick="deleteVideo('${v.id}')">हटाएँ</button>
        </div>
      </div>
    </article>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function openPlayer(id){
  current = videos.find(v=>v.id===id);
  if(!current) return;
  $("playerTitle").textContent=current.title;
  $("playerDesc").textContent=current.description || "";
  $("download").href=current.url;
  $("player").src=current.url;
  $("quality").value="auto";
  $("playerModal").hidden=false;
}
function closePlayer(){ $("player").pause(); $("player").src=""; $("playerModal").hidden=true; }
function changeQuality(){
  // This starter keeps one source file. Real multi-quality streaming requires transcoding/HLS.
  // The selector is retained so it can be upgraded to 360p/720p/1080p HLS later.
  $("player").play();
}
function openUpload(){ $("uploadModal").hidden=false; }
function closeUpload(){ $("uploadModal").hidden=true; $("uploadMsg").textContent=""; }

$("search").addEventListener("input",render);

$("uploadForm").addEventListener("submit", e=>{
  e.preventDefault();
  const form = $("uploadForm");
  const data = new FormData(form);
  const xhr = new XMLHttpRequest();
  xhr.open("POST","/api/upload");
  $("progressWrap").hidden=false;
  $("uploadMsg").textContent="अपलोड हो रहा है...";
  xhr.upload.onprogress = e=>{
    if(e.lengthComputable){
      const pct=Math.round(e.loaded/e.total*100);
      $("progress").style.width=pct+"%";
      $("progressText").textContent=pct+"%";
    }
  };
  xhr.onload=async()=>{
    if(xhr.status===200){
      $("uploadMsg").textContent="वीडियो सफलतापूर्वक अपलोड हो गया!";
      form.reset();
      await loadVideos();
      setTimeout(closeUpload,700);
    } else {
      try{$("uploadMsg").textContent=JSON.parse(xhr.responseText).error}catch{$("uploadMsg").textContent="अपलोड विफल हुआ";}
    }
  };
  xhr.onerror=()=> $("uploadMsg").textContent="नेटवर्क समस्या।";
  xhr.send(data);
});

async function deleteVideo(id){
  if(!confirm("क्या यह वीडियो हटाना है?")) return;
  await fetch("/api/videos/"+id,{method:"DELETE"});
  loadVideos();
}
loadVideos();