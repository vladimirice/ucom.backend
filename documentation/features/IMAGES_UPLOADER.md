# Images uploader

Notes:
* This is a separate server to upload and distribute the images.
* Uploader knows nothing about when an image is used. It is only a storage.
* To change an existing image please upload the new one and change the existing link
inside the `entity_images` field.

Workflow:
* Client uploads an image to the uploader application.
* Uploader returns an absolute link to the image. Actually, it responds with a JSON structure with the link inside it.
It allows uploading several images in one request without changing the interface.
* Client saves this link in a special JSON structure named `entity_images.` This is a column
in a database of table `posts,` `comments,` etc.
* Client sends a post request with `entity_images` to any main application route which supports it.
* The backend application validates the basic `entity_images` structure and saves it inside the database `as-is.`
* In the future, GET request backend application responds to the client and provides a saved `entity_images.`
structure.

Benefits:
* Easy to extend. A client application can extend the `entity_images` JSON structure totally by itself without
any backend application changes.
* Easy to scale. It is possible to implement CDN in the future with the same domain.
* Minimum backend development involvement - it is required to add an `entity_images` column to the table
and allow saving of this field.

Further improvements:
* A background task to remove unused images
* Rate limiters per one user per hour/day/month to avoid DOS attacks

## An example of possible uploader request-response with a resizing feature (Draft)

Request body
```
sizes: [ // supported only for a .jpg extension
    '800x800',
    '400x400',
    '150x150',
    {
        max_width: 800,
        max_height: 800,
    },
    {


    },
],
// and attach file required to be uploaded
```
Response
content-type: JSON

example for .jpg
```
{
    files: [
      {
        url: `${upload_url}/${filename}.jpg`, // there is no size in the filename!
        type: 'original', // reserved for the future
        width: 600,
        height: 400,
      },
      {
        url: `${upload_url}/${filename}.jpg`,
        type: 'resize',


        size: '400x200', // required only if type is a 'resize'
      },
      {
        url: `${upload_url}/${filename}.jpg`,
        type: 'resize',
        width: 600,
        height: 400,

        resize_id: '800x800',


        size: '600x400', // required only if type is a 'resize'
      },
      {
        url: `${upload_url}/${filename}.jpg`,
        type: 'resize',
        size: '150x50',
      },
    ],
    metadata: { // For future usage
        resize_results: {
            '150x150': {
                status: 'ok',
                requested: '150x150',
                actual: '150x50',
            },
            '400x400': {
                status: 'ok',
                requested: '400x400',
                actual: '400x200',
            },
            '800x800': {
                status: 'impossible',
                requested: '800x800',
                actual: '600x400'
                message: 'Original image size is less than the required value',
            },
        }
    }
};
```

example for .gif
```
{
    files: [
      {
        url: `${upload_url}/${filename}.gif`,
        type: 'original',
      },
    ],
    metadata: {}
};
```
