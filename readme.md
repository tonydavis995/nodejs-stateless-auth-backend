# Stateless Authentication Backend Example Using Nodejs

An express js authentication backend for login/signup with Facebook|Google|Github|Twitter|Local using oauth,postgres,sequelize,passport.

## Installation

Use the package manager [npm](https://www.npmjs.com) to test.

```bash
npm install
npm start
```

## Postman Documentation

Use the postman api [documentation](https://documenter.getpostman.com/view/6421015/SVfRtT99) for reference.

##Client side Request Token requests

```Facebook:https://www.facebook.com/v4.0/dialog/oauth?client_id=525757241562402&redirect_uri=https://brew.com/following&scope=email&response_type=code ```

```Github: https://github.com/login/oauth/authorize?scope=user:email&client_id=75884e6f66f5190d1864 ```

```Google: https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=http://localhost:8080&response_type=code&client_id=1069774391511-acielfnmuket6k7u4q4ggkt2igkelevh.apps.googleusercontent.com&approval_prompt=force&scope=https://www.googleapis.com/auth/userinfo.email+https://www.googleapis.com/auth/userinfo.profile&access_type=offline ```

## Buy me a Coffee
If this helped you in any way feel free to [buy me a coffee](https://www.buymeacoffee.com/DXaWkCE)