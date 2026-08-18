# Read Me First
The following was discovered as part of building this project:

* The original package name 'com.security.spring-security' is invalid and this project uses 'com.security.spring_security' instead.

# Getting Started

### Local Secrets Setup (Recommended)

This project is configured to use the `local` profile by default unless `SPRING_PROFILES_ACTIVE` is set.

1. Create `src/main/resources/application-local.properties` from `src/main/resources/application-local.example.properties`.
2. Put your real DB and Google OAuth credentials only in `application-local.properties` (this file is gitignored).
3. Run the app normally.
4. In Google Cloud Console, add this redirect URI to your OAuth client: `http://localhost:8080/login/oauth2/code/google`.

PowerShell commands:

```powershell
Copy-Item "src/main/resources/application-local.example.properties" "src/main/resources/application-local.properties"
.\mvnw.cmd spring-boot:run
```

Optional (explicit profile override):

```powershell
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run
```

### Reference Documentation
For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/4.0.3/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/4.0.3/maven-plugin/build-image.html)
* [Spring Security](https://docs.spring.io/spring-boot/4.0.3/reference/web/spring-security.html)
* [Spring Web](https://docs.spring.io/spring-boot/4.0.3/reference/web/servlet.html)
* [Spring Boot DevTools](https://docs.spring.io/spring-boot/4.0.3/reference/using/devtools.html)

### Guides
The following guides illustrate how to use some features concretely:

* [Securing a Web Application](https://spring.io/guides/gs/securing-web/)
* [Spring Boot and OAuth2](https://spring.io/guides/tutorials/spring-boot-oauth2/)
* [Authenticating a User with LDAP](https://spring.io/guides/gs/authenticating-ldap/)
* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
* [Accessing data with MySQL](https://spring.io/guides/gs/accessing-data-mysql/)

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.

