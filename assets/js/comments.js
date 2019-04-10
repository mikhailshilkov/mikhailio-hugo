
jQuery(document).ready(function($){

    const issueID = jQuery("#gh-comments-list").text();
    if (issueID) {
      const api_url = `https://api.github.com/repos/mikhailshilkov/mikhailio-hugo/issues/${issueID}/comments`;
      jQuery.ajax(api_url, {
        headers: {Accept: "application/vnd.github.v3.html+json"},
        dataType: "json",
        success: function(comments) {
            const orderedComments = reorderReplies(comments);
            jQuery("#gh-comments-list").html("");
            jQuery("#gh-comments-list").show();            
            jQuery.each(orderedComments, function(i, comment) {

                var date = new Date(comment.created_at);
                
                var t = "<div class='speech-bubble p-4 border " + (comment.isReply ? "border-top-0" : "mt-4") + "'>";
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

function reorderStep(agg, rem) {
  if (rem.length == 0) {
    return agg;
  }

  const comment = rem[0];
  agg.push(comment);

  let rest = rem.slice(1);

  const index = rest.findIndex(c => c.body_html.indexOf('@' + comment.user.login) > 0 && c.created_at > comment.created_at);
  if (index >= 0) {
    const reply = rest[index];
    reply.isReply = true;
    if (index > 0) {
      // move reply to head
      rest.splice(index, 1);
      rest.unshift(reply);
    }
  }

  return reorderStep(agg, rest);
}

function reorderReplies(comments) {
  return reorderStep([], comments);
}