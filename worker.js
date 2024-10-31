async function handleRequest(request) {
    const USER_ID = 'temp';
    const url = new URL(request.url);
    const path = url.pathname.split('/').filter(Boolean);

    const getResponse = (content, type = 'text/plain') =>
        new Response(content, { headers: { 'Content-Type': `${type}; charset=utf-8` } });

    const renderForm = (input1 = '', input2 = '') => `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #e6f7ff; font-family: Arial, sans-serif; margin: 0; }
                .container { text-align: center; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); max-width: 80%; }
                textarea { width: 100%; min-height: 100px; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; resize: vertical; }
                input[type="submit"] { background-color: #007BFF; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; }
                input[type="submit"]:hover { background-color: #0056b3; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>订阅仓库</h1>
                <form method="POST" action="/${USER_ID}/manage">
                    <label for="input1">节点:</label>
                    <textarea id="input1" name="input1" required>${input1}</textarea>
                    <label for="input2">订阅:</label>
                    <textarea id="input2" name="input2" required>${input2}</textarea>
                    <input type="submit" value="提交">
                </form>
            </div>
        </body>
        </html>
    `;

    if (request.method === 'POST' && path[0] === USER_ID && path[1] === 'manage') {
        const { input1 = '', input2 = '' } = Object.fromEntries(await request.formData());
        await mixproxy.put(USER_ID, `${input1}\n${input2}`);
        return getResponse('节点已保存！');
    }

    if (path[0] === USER_ID && path[1] === 'manage') {
        const userid = (await mixproxy.get(USER_ID)) || '';
        const [input1, input2] = userid.split('\n');
        return getResponse(renderForm(input1, input2), 'text/html');
    }

    if (path.length === 0) {
        return getResponse(renderForm(), 'text/html');
    }

    if (path[0] === USER_ID) {
        const userid = (await mixproxy.get(USER_ID)) || '';
        return getResponse(userid);
    }

    return getResponse('未找到该用户', 'text/plain', 404);
}

addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));
