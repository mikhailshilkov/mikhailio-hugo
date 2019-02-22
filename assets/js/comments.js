
jQuery(document).ready(function($){

    const issueID = jQuery("#gh-comments-list").text();
    if (issueID) {
      const url = `https://github.com/mikhailshilkov/mikhailio-hugo/issues/${issueID}`;
      const api_url = `https://api.github.com/repos/mikhailshilkov/mikhailio-hugo/issues/${issueID}/comments`;
      jQuery.ajax(api_url, {
        headers: {Accept: "application/vnd.github.v3.html+json"},
        dataType: "json",
        success: function(comments) {
            jQuery("#gh-comments-list").html("Visit the <b><a href='" + url + "'>Github Issue</a></b> to comment on this page");
            jQuery("#gh-comments-list").show();
            jQuery.each(comments, function(i, comment) {

                var date = new Date(comment.created_at);

                var t = "<div id='gh-comment'>";
                t += "<img src='" + comment.user.avatar_url + "' width='24px'>";
                t += "<b><a href='" + comment.user.html_url + "'>" + comment.user.login + "</a></b>";
                t += " posted at ";
                t += "<em>" + date.toUTCString() + "</em>";
                t += "<div id='gh-comment-hr'></div>";
                t += comment.body_html;
                t += "</div>";
                jQuery("#gh-comments-list").append(t);
            });
        },
        error: function() {
            jQuery("#gh-comments-list").append("Comments are not open for this page yet.");
        }
      });    
    }

});
