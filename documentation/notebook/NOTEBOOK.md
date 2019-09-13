# NOTEBOOK

Goal - just to save workflow before implementation.

mini-post for the trust: decomposition

------------ Spirin ------------

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

