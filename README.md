PictureYourself
===============

## Project Description
The Picture Yourself application uses visual storytelling practices like the "selfie" to help improve college access and provide students with a tool to navigate the college process.

## installation

1. Install Ruby version 1.9.3-p448,
2. Install all the Ruby libraries by running `bundle install`. Make sure that `bundler` gem is installed (if it is not, run `gem install bundler`).
3. Install homebrew on Mac or Linux.
4. Install OpenCV by running `brew install opencv`
5. Run `grabcut.sh` script to configure GrabCut.

## Running the app

To start the app, run

```
ruby picture_yourself.rb
```

## Deploying

Check out the [wiki](https://github.com/berkeleygamelab/PictureYourself/wiki) to learn how to deploy the app to different servers.

## Frameworks

  - Backend uses Ruby with [Sinatra](http://www.sinatrarb.com/)
  - Frontend uses
    - [Angular.js](https://angularjs.org/)
    - [jQuery](https://jquery.com/) (which should be removed in favor of only Angular)
    - [Kinetic.js](http://kineticjs.com/) for the canvas functionality
      - Unfortunately, Kinetic.js is no longer supported. The documentation is included in the repo.
    - [slick.js](http://kenwheeler.github.io/slick/) for the background chooser carousel
    - [bootstrap](http://getbootstrap.com/) for modals and various other DOM elements

## Environment variables
You will find, littered throughout the code, reference to environment variables (e.g. `ENV["FEED_EDIT_TOKEN"]`). In order to avoid leaking private info, we use
`dotenv` gem to store all our environment variables in `.env` file in root directory. Go ahead and create this file on your local machine, and contact
dmitriskj@gmail.com to get all the environment variables.

NOTE! If you're going to be deploying to a new server instance, you will need to
copy these environment variables. I recommend creating `~/.profile` file on that
server and entering `export FEED_EDIT_TOKEN='xyz'`.

## Troubleshooting
- Occasionally, closing shotgun (Control-C) will hang, causing the port to be unusable in the future. To fix this, run `shotgun -p <port number> picture_yourself.rb`
- When making changes locally, just refreshing the page will register the new changes (Shotgun does NOT need to be restarted). However, Shotgun DOES have to be restarted when installing new gems.
- If you encounter the following error (Mac OSX 10.10.3)

  ```
  dyld: Library not loaded: /usr/local/lib/libImath-2_2.12.dylib
    Referenced from: /usr/local/lib/libopencv_highgui.2.4.dylib
    Reason: image not found
  ```
  then you may need reinstall OpenCV from source instead of bottled version (source). If you have OpenCV installed already, run   brew remove opencv followed by brew install -fs opencv.


## Style
- Use 4 spaces (**not tabs**) for indentation. Most text editors should automatically change tabs into spaces.
- Write descriptive commit messages.


## File Organization
  - In general, the CSS and JS related to any view will be in `public/css/<view name>.css` and `public/js/<view name>`
  - `layout.erb` is a template loaded on every page. All CSS related to it are located in `public/css/layout.css` and all JS related to it is in the directory `public/js/layout`.
  - `index.erb` controls which of the other views are seen. CSS in `public/css/index.css`, JS in `public/js/index`

### File Logic

  - Controllers:
    - handles user interaction
    - writes / updates scope variables for the view
    - connects view with services and other data objects

  - Services
    - like Class functions or "pseudo model" for the stage
    - group together functions and variable that share a common theme
        - eg. Camera service controlls all variables that deal with taking a picture

  - Factories
    - like "constructors"
    - create instances of objects

  - Helpers
    - functions that deal with setup, independent processes, etc. that don't necessarily relate directly to user interaction
    - don't logically map to abstract entity (e.g. Camera, Sticker)



### To contribute to this app:

- Create a branch with `git checkout -b <name of branch>`
- Push code to repo with `git push origin <name of branch>`
- Have another team member review your code before either of you merge with the master branch
