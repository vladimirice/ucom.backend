import PostsHelper = require('../integration/helpers/posts-helper');
import _ = require('lodash');
import ResponseHelper = require('../integration/helpers/response-helper');

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

    expect(postOffer.offer_data.tokens.length).toBe(expectedTokens.length);
    for (const actual of postOffer.offer_data.tokens) {
      const expected = expectedTokens.find(item => item.symbol === actual.symbol);
      ResponseHelper.expectNotEmpty(expected);

      expect(actual).toMatchObject(expected);
    }

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
