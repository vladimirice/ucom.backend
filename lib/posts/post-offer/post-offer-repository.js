const models = require('../../../models');
const sequelize = models.sequelize;
const PostTypeDictionary = require('../post-type-dictionary');
const _ = require('lodash');

const POST_TYPE__OFFER = PostTypeDictionary.getTypeOffer();

class PostOfferRepository {
  static async createNewOffer(data, user) {
    data['id'] = null;
    data['user_id'] = user.id;
    data['current_rate'] = 0;
    data['current_vote'] = 0;
    data['post_type_id'] = POST_TYPE__OFFER;

    const newPost = await PostOfferRepository.getMainModel().create(data);

    data['post_id'] = newPost.id;
    await this.getPostOfferModel().create(data);


    // await sequelize.transaction(async transaction => {
    //   newPost = await PostOfferRepository.getMainModel().create(data, transaction);
    //
    //   data['post_id'] = newPost.id;
    //
    //   // const offerPostData = _.pick(data, [
    //   //   'action_button_title',
    //   //   'action_button_url',
    //   //   'post_id',
    //   //   'action_duration_in_days',
    //   // ]);
    //
    //   offerPost = await this.getPostOfferModel().build({
    //     'action_button_title': '12345'
    //   }, transaction);
    //
    //   const errors = await offerPost.validate();
    //
    //   await offerPost.save(transaction);
    //
    //   const dadsa = 0;
    // });


    // TODO create unique ID
    // await newPost.update({
    //   'blockchain_id': PostsRepository.getUniqId(newPost.id)
    // });

    return newPost;
  }

  async updateRelations(user, deltaData, modelName, userData) {
    await models.sequelize
      .transaction(async transaction => {

        // Update addresses
        await Promise.all([
          deltaData.deleted.map(async data => {
            await data.destroy({ transaction });
          }),

          deltaData.added.map(async data => {

            data['user_id'] = user.id;

            let newModel = models[modelName].build(data);
            await newModel.save(); // TODO check is transaction work
          }),

          deltaData.changed.map(async data => {
            const toUpdate = user[modelName].find(_data => _data.id === data.id);
            await toUpdate.update(data, { transaction });
          })
        ]);

        if (userData) {
          return await user.update(userData, { transaction });
        }

        return true;
      })
  }





  static async findAllByAuthor(userId, isRaw = true) {
    const data = await this.getMainModel().findAll({
      where: {
        user_id: userId,
        post_type_id: POST_TYPE__OFFER
      },
      include: [
        {
          model: this.getPostOfferModel()
        }
      ],
      order: [
        ['id', 'DESC']
      ],
    });

    if (isRaw) {
      return data.map(data => {
        return data.toJSON();
      });
    }

    return data;
  }

  static async findLast(isRaw = true) {
    const data = await this.getMainModel().findOne({
      where: {
        post_type_id: POST_TYPE__OFFER
      },
      include: [
        {
          model: this.getPostOfferModel()
        }
      ],
      order: [
        ['id', 'DESC']
      ],
      limit: 1
    });

    return isRaw ? data.toJSON() : data;
  }

  static async findLastByAuthor(user_id, isRaw = true) {
    const data = await this.getMainModel().findOne({
      where: {
        user_id,
        post_type_id: POST_TYPE__OFFER
      },
      include: [
        {
          model: this.getPostOfferModel()
        }
      ],
      order: [
        ['id', 'DESC']
      ],
      limit: 1
    });


    return isRaw ? data.toJSON() : data;
  }

  static getMainModel() {
    return models['posts'];
  }

  static getPostOfferModel() {
    return models['post_offer']
  }
}

module.exports = PostOfferRepository;