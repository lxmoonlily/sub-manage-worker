async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname.split('/').filter(Boolean);

    const getResponse = (content, type = 'text/plain') =>
        new Response(content, { headers: { 'Content-Type': `${type}; charset=utf-8` } });

    const renderForm = (userId = '', input1 = '', input2 = '') => `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * { box-sizing: border-box; }
                body { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f4f8; font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; }
                .container { text-align: center; background: #ffffff; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); width: 90%; max-width: 600px; }
                h1 { color: #333; font-size: 24px; margin-bottom: 20px; }
                label { display: block; font-weight: bold; color: #555; margin-top: 15px; }
                input[type="text"], textarea { 
                    width: 100%; padding: 12px; margin-top: 8px; margin-bottom: 20px; 
                    border: 1px solid #ccc; border-radius: 6px; font-size: 16px; 
                    transition: border-color 0.3s ease-in-out; 
                }
                input[type="text"]:focus, textarea:focus { border-color: #66afe9; outline: none; }
                textarea { min-height: 120px; resize: vertical; }
                input[type="submit"] { 
                    background-color: #007BFF; color: white; padding: 12px 25px; border: none; 
                    border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; 
                    transition: background-color 0.3s ease; 
                }
                input[type="submit"]:hover { background-color: #0056b3; }
                button { 
                    background-color: #dc3545; color: white; padding: 12px 25px; border: none; 
                    border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; 
                    transition: background-color 0.3s ease; 
                }
                button:hover { background-color: #c82333; } /* Hover effect for delete button */
            </style>
            <script>
                function setFormAction() {
                    const userId = document.getElementById('userId').value;
                    if (userId) {
                        document.getElementById('form').action = '/' + userId + '/manage';
                    }
                }
            </script>
            
        </head>
        <body>
            <div class="container">
                <h1>订阅仓库</h1>
                <form method="POST" id="form" onsubmit="setFormAction()">
                    <label for="userId">User ID:</label>
                    <input type="text" id="userId" name="user_id" value="${userId}" placeholder="输入您的 User ID" required>
                    
                    <label for="input1">节点:</label>
                    <textarea id="input1" name="input1" placeholder="在此输入节点信息" required>${input1}</textarea>
                    
                    <label for="input2">订阅:</label>
                    <textarea id="input2" name="input2" placeholder="在此输入订阅内容" required>${input2}</textarea>
                    
                    <input type="submit" value="提交">
                    <button type="button" onclick="deleteUser('${userId}')">删除</button>

                </form>
            </div>
        <script>
            function deleteUser(userId) {
                if (confirm('确定要删除该用户吗？')) {
                    fetch('/' + userId + '/delete', { method: 'DELETE' }) // 修改为 DELETE 请求
                        .then(response => response.text())
                        .then(data => {
                            alert(data); // 显示删除结果
                            window.location.href = '/'; // 重定向到主页
                        });
                }
            }
        </script>
        </body>
        </html>
    `;

if (request.method === 'POST') {
    const formData = Object.fromEntries(await request.formData());
    const userId = formData.user_id || 'temp';
    const input1 = formData.input1 || '';
    const input2 = formData.input2 || '';
    
    if (path[0] === userId && path[1] === 'manage') {
        await mixproxy.put(userId, `${input1}\n${input2}`);
        return getResponse(`
            <html>
            <head>
                <script>
                    alert('节点已保存！');
                    window.location.href = '/${userId}/manage'; // Redirect back to manage page
                </script>
            </head>
            <body></body>
            </html>
        `, 'text/html');
    }
    
    return getResponse(renderForm(userId, input1, input2), 'text/html');
}

    if (path.length === 0) {
        return getResponse(renderForm(), 'text/html');
    }

    const userId = path[0];
    if (path[1] === 'delete') {
        await mixproxy.delete(userId); // 假设有一个 delete 方法来删除数据
        return getResponse('用户已删除！');
    }
    
    if (path[1] === 'manage') {
        const useridData = (await mixproxy.get(userId)) || '';
        const [input1, input2] = useridData.split('\n');
        return getResponse(renderForm(userId, input1, input2), 'text/html');
    }

    const useridData = (await mixproxy.get(userId)) || '';
    
    if (!useridData) {
        return getResponse('未找到该用户', 'text/plain', 404);
    }
    return getResponse(useridData);
}

addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));
