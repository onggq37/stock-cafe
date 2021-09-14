# stock-cafe
web app to track my stock portfolio

Overall Architect
MVC

Difficulties faced:
- Implementing local passport authentication
- Query the overall price per stock

Solution:
- Research on passport and read through the documents
- Found out about aggregate and use it to consolidate mongo data

User Stories:
- Initialise
- Add Transaction
- Show Transaction
- Edit Transaction
- Delete Transaction
- Overview page
- Refractoring stockcafe routes into router
- Setting up passport, session and flash
- Register function
- Login function
- Logout function
- Authentication middleware
- Push to heroku and set up atlas
- Create homepage and styling
- style login and register page

Thing i want to add
- Add diviend
- add price validation
- add fee
- add Ticker type and Pie chart ( use chart.js )
- add daily p&l
- handle error properly
- add password strength
- add authroization
- add personal portfolio
- add option for multiple portfolio (add a new key(eg, belongTo) in transaction model)
- add different exchanges