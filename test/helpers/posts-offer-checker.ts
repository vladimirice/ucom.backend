import PostsHelper = require('../integration/helpers/posts-helper');
import _ = require('lodash');

class PostsOfferChecker {
  public static checkGithubAirdropOffer(
    postOffer,
    airdropId: number,
    expectedTokens: any,
    startedAt: string,
    finishedAt: string,
  ): void {
    expect(postOffer.offer_data).toBeDefined();
    expect(postOffer.offer_data.airdrop_id).toBe(airdropId);
    expect(postOffer.offer_data.tokens).toMatchObject(expectedTokens);

    expect(postOffer.started_at).toBe(startedAt);
    expect(postOffer.finished_at).toBe(finishedAt);
  }

  public static checkGithubAirdropOfferStructure(
    postOffer,
    options,
  ): void {
    expect(postOffer).toBeDefined();
    PostsHelper.checkMediaPostFields(postOffer, options);

    expect(postOffer.offer_data).toBeDefined();
    expect(typeof postOffer.offer_data.airdrop_id).toBe('number');
    expect(postOffer.offer_data.airdrop_id).toBeGreaterThan(0);

    expect(Array.isArray(postOffer.offer_data.tokens)).toBeTruthy();
    expect(_.isEmpty(postOffer.offer_data.tokens)).toBeFalsy();

    expect(typeof postOffer.started_at).toBe('string');
    expect(postOffer.started_at.length).toBeGreaterThan(0);

    expect(typeof postOffer.finished_at).toBe('string');
    expect(postOffer.finished_at.length).toBeGreaterThan(0);
  }
}

export = PostsOfferChecker;
