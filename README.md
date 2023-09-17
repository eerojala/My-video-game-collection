# My Video Game Collection
A web application which allows users to keep track of their video game collections.

Time documentation (in finnish): https://docs.google.com/spreadsheets/d/1wUKjUl6CkGVkz__ICiACWJ4O6oHXW2BRpPoX9aHM8E0/edit?usp=sharing  
Frontend repository:  https://github.com/eerojala/MVGC-Frontend  

NOTE: App not currently running online due to Heroku not offering a completely free plan anymore.

## Instructions

### Registering a new account
To register a new account, click on the 'register' button located on the navigation bar.  
  
A page containing a form will open where the user can register a new account. 
   
Username must be unique and atleast 3 characters long.  
  
Password must be atleast 5 characters long, and the repeated password check must match the original given password

### Logging in
After registering a new account, the user will be automatically redirected to the login page.  
  
Alternatively, the user may simply click the 'Login' button to be taken to the same page.  

To log out, simply click 'Logout' on the navigation bar.

### Viewing and creating games and platforms
The user may view a list of games or platforms by clicking on the respective button in the navigation bar.  
  
The user may further view more detailed information on a single entry by clicking on their names.  
  
If the user is logged in on an admin account, the platform and game pages will also display a form which allows you to add new platforms or games to the database.  
    
A game must have a name, platform, year and developer(s). Publishers are optional. To add multiple developers/publishers, separate them with a comma and a single space  
  
A platform must have a name, creator and year.  

### Viewing your and others' collections
To view an user's game collection, click on their username on the Users-page accessed by clicking on 'Users' in the navigation bar.
  
If the user is logged in, they may access their own collection page by clicking on their username on the navigation bar.  

### Adding games to your collection
If the user is logged in, they may add games to their collections by navigating to the 'Games' page and clicking on the button next to the desired game.  
  
This will take you to a form where you may give the new game a rating and specify their status as 'Unfinished', 'Beaten' or 'Completed'  
  
### Editing your collection
On their collection page, users can update their collection entries provided they are logged in.  
  
Clicking on the 'Update' button will take you to a form where you may change the desired game's status and score.  
  
To remove a game from your collection, simply click on the 'Delete' button next to the update button.
