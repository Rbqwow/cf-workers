// Thanks to https://github.com/cmliu/CF-Workers-Raw
// Environment variables:
// GH_TOKEN = github token
// GH_NAME = github username
// GH_REPO = github repositories
// GH_BRANCH = repositories branch
// TOKEN = password
// URL302 = redirect url

export default {
    async fetch(request, env) {
      const url = new URL(request.url);
  
      if (url.pathname !== "/") {
        let githubRawUrl = "https://raw.githubusercontent.com";
  
        if (new RegExp(githubRawUrl, "i").test(url.pathname)) {
          githubRawUrl += url.pathname.split(githubRawUrl)[1];
        } else {
          if (env.GH_NAME) {
            githubRawUrl += "/" + env.GH_NAME;
            if (env.GH_REPO) {
              githubRawUrl += "/" + env.GH_REPO;
              if (env.GH_BRANCH) githubRawUrl += "/" + env.GH_BRANCH;
            }
          }
          githubRawUrl += url.pathname;
        }
  
        return await mainFunction(env, request, url, githubRawUrl);
      }
  
      const response = await handleURL302(env, request);
      if (response) {
        return response;
      }
    },
  };
  
  async function fetchGitHubContent(env, request, githubRawUrl, token) {
    const githubToken = token;
    if (!githubToken || githubToken == "") {
      const response = await handleURL302(env, request);
      if (response) {
        return response;
      }
    }
  
    const headers = new Headers();
    headers.append("Authorization", `token ${githubToken}`);
  
    let response;
    try {
      response = await fetch(githubRawUrl, { headers });
    } catch (error) {
      return new Response("404", { status: 404 });
    }
  
    if (response.ok) {
      const content = await response.text();
      return new Response(content, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
        },
      });
    } else {
      return new Response(response.status.toString(), {
        status: response.status,
      });
    }
  }
  
  async function mainFunction(env, request, url, githubRawUrl) {
    let token = "";
    if (env.GH_TOKEN && env.TOKEN && url.searchParams.get("token")) {
      if (env.TOKEN == url.searchParams.get("token")) {
        token = env.GH_TOKEN;
      } else {
        return new Response("403", { status: 403 });
      }
    } else {
      const response = await handleURL302(env, request);
      if (response) {
        return response;
      }
    }
  
    const response = await fetchGitHubContent(env, request, githubRawUrl, token);
    if (response) {
      return response;
    }
  
    return new Response(await nginx(), {
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
      },
    });
  }
  
  async function handleURL302(env, request) {
    const envKey = env.URL302 ? "URL302" : env.URL ? "URL" : null;
    if (envKey) {
      const URLs = await ADD(env[envKey]);
      const URL = URLs[Math.floor(Math.random() * URLs.length)];
      return envKey === "URL302"
        ? Response.redirect(URL, 302)
        : fetch(new Request(URL, request));
    }
    return null;
  }
  
  async function nginx() {
    const text = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Welcome to nginx!</title>
      <style>
        body {
          width: 35em;
          margin: 0 auto;
          font-family: Tahoma, Verdana, Arial, sans-serif;
        }
      </style>
    </head>
    <body>
      <h1>Welcome to nginx!</h1>
      <p>
        If you see this page, the nginx web server is successfully installed and
        working. Further configuration is required.
      </p>
  
      <p>
        For online documentation and support please refer to
        <a href="http://nginx.org/">nginx.org</a>.<br />
        Commercial support is available at
        <a href="http://nginx.com/">nginx.com</a>.
      </p>
  
      <p><em>Thank you for using nginx.</em></p>
    </body>
  </html>
  `;
    return text;
  }
  
  async function ADD(envadd) {
    var addtext = envadd.replace(/[	|"'\r\n]+/g, ",").replace(/,+/g, ",");
    if (addtext.charAt(0) == ",") addtext = addtext.slice(1);
    if (addtext.charAt(addtext.length - 1) == ",")
      addtext = addtext.slice(0, addtext.length - 1);
    const add = addtext.split(",");
    return add;
  }
  