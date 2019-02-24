"use strict";
class ActivityIndexFormulas {
    static getPostActivityIndex(stats) {
        const commentsCoeff = 3;
        const repostsCoeff = 1.5;
        const upvotesCoeff = 1;
        const downvotesCoeff = 1;
        const description = `${commentsCoeff}*(number_of_comments_with_replies) + ${repostsCoeff}*(number_of_reposts) + ${upvotesCoeff}*(number_of_upvotes) + ${downvotesCoeff}*(number_of_downvotes)`;
        const resultValue = commentsCoeff * stats.comments
            + repostsCoeff * stats.reposts
            + upvotesCoeff * stats.upvotes
            + downvotesCoeff * stats.downvotes;
        return {
            resultValue,
            description,
        };
    }
    static getOrgActivityIndex(stats) {
        const directPostsCoeff = 1.5;
        const mediaPostsCoeff = 3;
        const followersCoeff = 1;
        const description = `${directPostsCoeff}*(number_of_posts) + ${mediaPostsCoeff}*(number_of_publications) + ${followersCoeff}*(number_of_followers)`;
        const resultValue = directPostsCoeff * stats.directPosts
            + mediaPostsCoeff * stats.mediaPosts
            + followersCoeff * stats.followers;
        return {
            resultValue,
            description,
        };
    }
    // Now it is completely equal formula to org - by design
    static getTagsActivityIndex(stats) {
        const directPostsCoeff = 1.5;
        const mediaPostsCoeff = 3;
        const followersCoeff = 1;
        const description = `${directPostsCoeff}*(number_of_posts) + ${mediaPostsCoeff}*(number_of_publications) + ${followersCoeff}*(number_of_followers)`;
        const resultValue = directPostsCoeff * stats.current_direct_posts_amount
            + mediaPostsCoeff * stats.current_media_posts_amount
            + followersCoeff * stats.current_followers_amount;
        return {
            resultValue,
            description,
        };
    }
}
module.exports = ActivityIndexFormulas;
