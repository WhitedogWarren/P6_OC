# P6_OC

This API code requires a mongoDB database :
 Table "sauces" :
   userId
   name
   manufacturer
   description
   mainPepper
   imaeUrl
   heat
   likes
   dislikes
   usersLiked ( Array )
   usersDisliked: ( Array )
   
 Table "users" :
   email
   password
   
  
This API code also requires a .env file with these variables :
DB_HOST ( mongoDB connexion url )
TOKEN_SECRET ( secret phrase for jwt encryption )
