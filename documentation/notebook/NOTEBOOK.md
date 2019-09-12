# NOTEBOOK

Goal - just to save workflow before implementation.

mini-post for the trust: decomposition

------------ Spirin ------------
Нужно обсудить фильтры в фиде, которыми мы будем фильтровать авто-апдейты. У нас была еще задача по фильтрам
"показывать только мой контент", вот она:
https://github.com/UOSnetwork/ucom.backend/issues/167

То есть, скорее всего фильтр нужно сделать универсальным, то есть с возможностью для будущего расширения.

Что пользователь может делать с постами? Все из этого он может делать с автоапдейтом?
* Видеть в новостном фиде и у себя на стене.
* Лайк или дизлайк и смотреть детализацию
* Репостить себе в профиль
* Шарить в социалках так, чтобы подгружалось описание
* Писать к посту комментарии
* Копировать ссылку и открывать на отдельной странице - в попапе или по ссылке
* Просматривать автора поста
* Просматривать коммьюнити поста, если сделан от лица коммьюнити
* Смотреть импортанс поста



---------------- Pasha ----------------
Автоапдейт-пост это будет особый тип поста. У него будет пустой title и body, их нужно рендерить на основе отдельного нового поля:
json_body. В этом поле по аналогии с notifications в специальной структуре будет представлены изменения. А как их отображать
в html - можно удобно решать на уровне фронтенда.

Подходит такой вариант?


---------------- Petya ----------------
Привет, Петя. Посмотри, пожалуйста, описание реализации автоапдейтов и покритикуй :)

* Решили в итоге, что обновление профиля/коммьюнити и т.п. будем делать пост по аналогии с репостом
* Начинаем с траста/антраста, это хотят тоже оформить событием-постом, который можно апвоутить, комментить и т.п.
* Это будет особый тип поста - автоапдейт. Название странное но прижилось. autoUpdate. то есть будет экшен:
create_auto_update_post_from_user - в рамках первого этапа
create_auto_update_post_from_organization - в будущем

Редактировать эти "посты". Их контент будет формироваться в зависимости от изменений, то есть у этого поста
(в отличие от репоста) в экшене будет заполнено свойство, в котором храним контент.

* Я подумал, что можно создавать этот пост 2м экшенем в добавок к трасту. И в дальнейшем тот же принцип -
при обновлении профиля юзера (а это транзакция тоже) - 2м экшенем добавлять создание этого спец-поста. Это ок?
* Посту будет присваиваться id по аналогии с существующими постами. "Ссылка на то, что пост описывает" - это и будет "соседнее"
действие экшена, у транзакции будет 2 экшена. То есть не нужно придумывать поле, указывающее на измененную сущность. Или все-таки нужно?
* Не помешает ли алгоритму рейта, что транзакция теперь будет состоять не из 1го экшена, а из двух?


Add auto-post to the trust/untrust action
Create a post in the backend Database, like repost, post-link to the updating action
Add new type of post-auto-update to the user feeds
Blockchain team communications


-------- Auto-update for trust/untrust transaction - wallet part ---------
After communications with Petya


------------ Auto-update for trust/untrust transaction - backend part
* During the trust create a new post with the type `autoUpdate`
* AutoUpdate post will have extra properties
    * This post will have empty body and json payload structure about the changes. Dedicated field like for notifications.
    * To show it inside feed fill entity_id_for, entity_name_for = for the given user => this post will be shown in the user fields
    * Place a hardcoded value to remove autoupdates on production and on staging before Pasha implementation
    * Write tests for commenting, voting, reposting


---------- Auto-update for trust/untrust transaction - feeds part ----------
* Add a filter - all posts

