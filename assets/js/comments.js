
jQuery(document).ready(function($){

    const issueID = jQuery("#gh-comments-list").text();
    if (issueID) {
      const api_url = `https://api.github.com/repos/mikhailshilkov/mikhailio-hugo/issues/${issueID}/comments`;
      jQuery.ajax(api_url, {
        headers: {Accept: "application/vnd.github.v3.html+json"},
        dataType: "json",
        success: function(comments) {
            jQuery("#gh-comments-list").html("");
            jQuery("#gh-comments-list").show();
            jQuery.each(comments, function(i, comment) {

                var date = new Date(comment.created_at);
                
                var t = "<div class='speech-bubble p-4 shadow-sm " + (comment.user.login === "mikhailshilkov" ? "" : "mt-4") + "'>";
                t += "<div class='post-top-meta'><div>";
                t += "<img class='author-thumb' src='" + comment.user.avatar_url + "' alt='" + comment.user.login + "'>";
                t += "</div><div>";
                t += "<a href='" + comment.user.html_url + "' target='_blank'>" + comment.user.login + "</a>";
                t += "<div class='author-description'>" + formatDate(date) + "</div></div></div>";
                t += "<div>" + comment.body_html + "</div></div>";

                jQuery("#gh-comments-list").append(t);
            });
        },
        error: function() {
            jQuery("#gh-comments-list").append("Comments are not open for this page yet.");
        }
      });    
    }

});

function formatDate(date) {
  const parts = date.toDateString().split(' ').slice(1);
  return `${parts[0]} ${parts[1]}, ${parts[2]}`;
}