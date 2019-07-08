const base = "https://mikhailio-fa.azurewebsites.net";
const path = window.location.pathname.split("/").filter(v => v).join("-");
const session = Math.random().toString(36).substring(3);

function heart() {
  const countSpan = document.getElementById("heartcount");
  const value = (parseInt(countSpan.innerHTML) || 0) + 1;
  countSpan.innerHTML = value;

  const url = `${base}/api/AddHeart`;
  jQuery.ajax(url, {
    type: "POST",
    headers: { Accept: "application/json" },
    dataType: "json",
    contentType: "application/json",
    data: JSON.stringify({ path, session }),
    success: response => {
      if (response && response.count) {
        countSpan.innerHTML = response.count;
      }
    },
    error: e => {
      console.error(e);
    }
  });
}

jQuery(document).ready(function ($) {
  const url = `${base}/api/GetHeartCount`;
  jQuery.ajax(url, {
    type: "POST",
    headers: { Accept: "application/json" },
    dataType: "json",
    contentType: "application/json",
    data: JSON.stringify({ path, session }),
    success: response => {
      const countSpan = document.getElementById("heartcount");
      countSpan.innerHTML = response.count;
    },
    error: e => {
      console.error(e);
    }
  });
});