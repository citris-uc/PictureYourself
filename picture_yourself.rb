
#------------------------------------------------------------------------------
# Libraries
#----------
require 'sinatra'
require 'base64'
require 'data_mapper'
require 'dm-timestamps'
require 'json'
require 'sinatra/contrib/all'
require 'mail'
require 'fileutils'
require "sinatra/activerecord"

#------------------------------------------------------------------------------
# App-specific models
#--------------------
require "./models/user.rb"

#------------------------------------------------------------------------------
# Routes
#--------------------
require "./routes/user.rb"

#------------------------------------------------------------------------------
# Configuration
#--------------
set :port, 80
set :bind, '128.32.189.148'
#trying to lock threads to avoid not receiving requests
set :lock, true
set :server, 'thin'
set :database_file, "database.yml"

# Connects to apis.rb and email.rb
require_relative 'apis'
require_relative 'email'

#mail Settings
domain = ENV["RAILS_HOST"] || 'py-bcnm.berkeley.edu'
options = { :address              => "smtp.gmail.com",
            :port                 => 587,
            :domain               => domain,
            :user_name            => 'picyourfuture',
            :password             => 'Py12ab21yP',
            :authentication       => 'plain',
            :enable_starttls_auto => true  }

Mail.defaults do
  delivery_method :smtp, options
end

#------------------------------------------------------------------------------
# handles OS detection for openCV
#--------------------------------

module OS
  def OS.windows?
    (/cygwin|mswin|mingw|bccwin|wince|emx/ =~ RUBY_PLATFORM) != nil
  end

  def OS.mac?
   (/darwin/ =~ RUBY_PLATFORM) != nil
  end

  def OS.unix?
    !OS.windows?
  end

  def OS.linux?
    OS.unix? and not OS.mac?
  end
end

#------------------------------------------------------------------------------
# GET /
#---------

get '/' do
  cookie = request.cookies["pyuserid"]

  # Check if cookie exits, if it does delete pictures associated with cookie
  unless cookie.nil?
    name = 'public/users/' + cookie
    FileUtils.rm_rf(Dir.glob(name))
  end
  FileUtils.rm_rf(Dir.glob('uploads/*'))

  erb :index
end

#------------------------------------------------------------------------------
# GET /tos
#---------

get "/tos" do
  erb :tos
end

#------------------------------------------------------------------------------
# GET /camera
#---------

get "/camera" do
  erb :camera
end

#------------------------------------------------------------------------------
# GET /background
#---------

get "/background" do
  erb :background
end

#------------------------------------------------------------------------------
# GET /scenario
#---------

get "/scenario" do
  erb :scenario
end

get "/selfie" do
  "users/#{request.cookies["pyuserid"]}/1_sticker.png"
end

#------------------------------------------------------------------------------
# POST /fileupload
#-----------------

post '/fileupload' do
    parsed = JSON.parse request.body.read, :symbolize_names => true
    dirname = 'uploads/'+parsed[:name]
    dirNumber = parsed[:count]
    image = parsed[:data].split(',')[1]

    unless File.directory?(dirname)
      FileUtils.mkpath dirname
    end

    File.open("#{dirname}/#{dirNumber}.png", 'wb') do |f|
      f.write(Base64.decode64(image))
    end
    # Needs to be updated to account for errors
    status 200
end

post '/grabcut' do
  parsed = JSON.parse request.body.read, :symbolize_names => true
  filename = "#{parsed[:pyuserid]}/#{parsed[:count]}.png"

  # TODO: What was the decision to separate the OpenCV libraries by OS? grabcut
  # works on Ubuntu while opencv_trans_UNIX is always missing some .so files. For
  # now, we'll go with grabcut for all OS.
  # if OS.mac?
  #   system("./grabcut uploads/#{filename} #{parsed[:coords]} #{parsed[:pyuserid]}")
  # elsif OS.unix?
  #   system("./opencv_trans_UNIX uploads/" + filename + ' ' + parsed[:coords] + ' ' + parsed[:pyuserid])
  # end
  system("./grabcut uploads/#{filename} #{parsed[:coords]} #{parsed[:pyuserid]}")

  "users/#{parsed[:pyuserid]}/#{parsed[:count]}_sticker.png"
end


# These are provided for ease of debugging, instead of going through the entire process every time
get '/snapshot' do
  erb :snapshot
end

get '/background' do
  erb :background
end

get '/slideshow' do
  erb :slideshow
end
