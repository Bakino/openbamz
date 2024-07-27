# Database structure

## Private schema

The private schema contains the account table. It is not readable by users

```
   ┌─────────────────────────────────────────────────┐    
   │  Schema private                                 │    
   ├─────────────────────────────────────────────────┤    
   │                                                 │    
   │ ┌────────────────────────────────────────────┐  │    
   │ │Table account                               │  │    
   │ ├────────────────────────────────────────────┤  │    
   │ │  _id            UUID - used as db username │  │    
   │ │  create_time    timestamp                  │  │    
   │ │  email                                     │  │    
   │ │  role           automatically set          │  │    
   │ │  password       password of db user        │  │    
   │ │  password_hash  password crypted           │  │    
   │ └────────────────────────────────────────────┘  │    
   │                                                 │    
   └─────────────────────────────────────────────────┘    
```

## Public schema

The public schema contains 
 - the functions to create account and authenticate user
 - the app table : list of all apps in the system

```
  ┌─────────────────────────────────────────────────┐ 
  │ Schema public                                   │ 
  ├─────────────────────────────────────────────────┤ 
  │                                                 │ 
  │ ┌────────────────────────────────────────────┐  │ 
  │ │Function create_account(email, password)    │  │ 
  │ ├────────────────────────────────────────────┤  │ 
  │ │ Create a new account with role             │  │ 
  │ │ normal_user                                │  │ 
  │ └────────────────────────────────────────────┘  │ 
  │                                                 │ 
  │ ┌────────────────────────────────────────────┐  │ 
  │ │Function authenticate(email, password)      │  │ 
  │ ├────────────────────────────────────────────┤  │ 
  │ │ Authenticate user and return a             │  │ 
  │ │ JWT token to be used in all GraphQL        │  │ 
  │ │ queries                                    │  │ 
  │ └────────────────────────────────────────────┘  │ 
  │                                                 │ 
  │ ┌────────────────────────────────────────────┐  │ 
  │ │Table app                                   │  │ 
  │ ├────────────────────────────────────────────┤  │ 
  │ │  code     code of the app, name of database│  │ 
  │ │  name     human name                       │  │ 
  │ │  owner    UUID of user owner               │  │ 
  │ │  admins   JSON list of other users admins  │  │ 
  │ └────────────────────────────────────────────┘  │ 
  │                                                 │ 
  └─────────────────────────────────────────────────┘ 
```

The app table is readable only by user authenticated.
A user can read only the app which he is the owner or admin
Only owner can update or delete an app

When an app is created, the corresponding database is created with a role `dbname_role` that can access everything in the database

The owner and admins are granted with this role.

When an app is deleted the corresponding database is deleted too