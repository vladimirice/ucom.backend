import { ContentTypesDictionary } from 'ucom.libs.common';

import UsersModelProvider = require('../../users/users-model-provider');

const _ = require('lodash');

const models = require('../../../models');

const userPreviewAttributes = UsersModelProvider.getUserFieldsForPreview();

const postStatsRepository = require('../stats/post-stats-repository');

const POST_TYPE__OFFER = ContentTypesDictionary.getTypeOffer();

class PostOfferRepository {
  /**
   *
   * @param {boolean} raw
   * @returns {Promise<Object>}
   */
  static async findAllPostOffers(raw = true) {
    return this.getMainModel().findAll({
      raw,
      where: {
        post_type_id: POST_TYPE__OFFER,
      },
    });
  }

  /**
   *
   * @param {Object} data
   * @param {number} userId
   * @param {Object} transaction
   * @returns {Promise<Object>}
   */
  static async createNewOffer(data, userId, transaction) {
    data.id = null;
    data.user_id = userId;
    data.current_rate = 0;
    data.current_vote = 0;
    data.post_type_id = POST_TYPE__OFFER;

    // eslint-disable-next-line you-dont-need-lodash-underscore/filter
    data.post_users_team = _.filter(data.post_users_team);

    const newPost = await PostOfferRepository.getMainModel().create(data, { transaction });

    data.post_id = newPost.id;
    await this.getPostOfferModel().create(data, { transaction });

    if (data.post_users_team && !_.isEmpty(data.post_users_team)) {
      data.post_users_team.forEach(async (user) => {
        const usersTeam = {
          post_id: newPost.id,
          user_id: +user.id,
        };

        await this.getPostUsersTeamModel().create(usersTeam, { transaction });
      });
    }

    await postStatsRepository.createNew(newPost.id, transaction);

    return newPost;
  }

  static async findOneById(postId, isRaw = false) {
    const result = await this.getMainModel().findOne({
      where: {
        id: postId,
        post_type_id: POST_TYPE__OFFER,
      },
      include: [
        {
          model: this.getPostOfferModel(),
        },
        {
          model: this.getPostUsersTeamModel(),
          as: 'post_users_team',
          include: [
            {
              model: models.Users,
              attributes: userPreviewAttributes,
            },
          ],
        },
      ],
    });

    if (!result) {
      return null;
    }

    return isRaw ? result.toJSON() : result;
  }

  // eslint-disable-next-line class-methods-use-this
  async updateRelations(user, deltaData, modelName, userData) {
    await models.sequelize
      .transaction(async (transaction) => {
        // Update addresses
        await Promise.all([
          deltaData.deleted.map(async (data) => {
            await data.destroy({ transaction });
          }),

          deltaData.added.map(async (data) => {
            data.user_id = user.id;

            const newModel = models[modelName].build(data);
            await newModel.save();
          }),

          deltaData.changed.map(async (data) => {
            const toUpdate = user[modelName].find((itemData) => itemData.id === data.id);
            await toUpdate.update(data, { transaction });
          }),
        ]);

        if (userData) {
          return user.update(userData, { transaction });
        }

        return true;
      });
  }

  static async findLast(isRaw = true) {
    const data = await this.getMainModel().findOne({
      where: {
        post_type_id: POST_TYPE__OFFER,
      },
      include: [
        {
          model: this.getPostOfferModel(),
        },
      ],
      order: [
        ['id', 'DESC'],
      ],
      limit: 1,
    });

    return isRaw ? data.toJSON() : data;
  }

  static async findLastByAuthor(userId, isRaw = true) {
    const data = await this.getMainModel().findOne({
      where: {
        user_id: userId,
        post_type_id: POST_TYPE__OFFER,
      },
      include: [
        {
          model: this.getPostOfferModel(),
        },
        {
          model: this.getPostUsersTeamModel(),
          as: 'post_users_team',
          include: [
            {
              model: models.Users,
              attributes: userPreviewAttributes,
            },
          ],
        },
      ],
      order: [
        ['id', 'DESC'],
      ],
      limit: 1,
    });

    if (!data) {
      return data;
    }

    return isRaw ? data.toJSON() : data;
  }

  static getMainModel() {
    return models.posts;
  }

  static getPostOfferModel() {
    return models.post_offer;
  }

  static getPostUsersTeamModel() {
    return models.post_users_team;
  }
}

export = PostOfferRepository;
