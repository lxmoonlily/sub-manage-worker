// 监听fetch事件并处理请求
addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {

    // 解析请求的URL
    const url = new URL(request.url);
    const path = url.pathname.split('/').filter(Boolean);
    const userId = path[0];
    
    // 获取加密用户名
    const { uuid, randomNum } = await Random_UUID_Number(userId, 1, 50);
    let olduserid = await findUserId(userId, uuid);

    // 处理POST请求
    if (request.method === 'POST') {
        const formData = Object.fromEntries(await request.formData());
        const { user_id: userId = '', input1 = '', input2 = '', inputSublink = '', inputSubconfig = '' } = formData;

        // 更新 sublink 和 subconfig 的值
        sublink = inputSublink || sublink;
        subconfig = inputSubconfig || subconfig;

        if (path[0] === userId && path[1] === 'manage') {
            const eninput1 = await encd(input1, uuid);
            const eninput2 = await encd(input2, uuid);
            const newuserid = await encd(userId, uuid);
            olduserid = await findUserId(userId, uuid);
            const storageKey = olduserid || newuserid;
            if (storageKey) {
                await mixproxy.put(storageKey, `${eninput1}@split@${eninput2}@split@${inputSublink}@split@${inputSubconfig}`);
            } else {
                console.error('User ID encryption error.');
            }
            return getResponse(`
                <html>
                <head>
                    <script>
                        alert('节点已保存！');
                        window.location.href = '/${userId}/manage';
                    </script>
                </head>
                <body></body>
                </html>
            `, 'text/html');
        }
        return getResponse(renderForm(userId, input1, input2, inputSublink, inputSubconfig), 'text/html');
    }

    if (path.length === 0) {
        return getResponse(renderForm(), 'text/html');
    }

    if (path[1] === 'delete') {
        await mixproxy.delete(olduserid);
        return getResponse('用户已删除！');
    }

    let useridData = olduserid ? (await mixproxy.get(olduserid)) || '' : '';

    if (path[1] === 'manage') {
        if (useridData === '') {
            const randomSubscriptions = Array.from({ length: randomNum }, () => 
                `vless://${uuid}@hk-work.lxmoon.eu.org:443?encryption=none&security=tls&sni=hk-work.lxmoon.eu.org&fp=randomized&type=ws&host=hk-work.lxmoon.eu.org&path=%2F%3Fed%3D2048#hk-work.lxmoon.eu.org`
            );
            return getResponse(renderForm(userId, randomSubscriptions.join("\n"), '', sublink, subconfig), 'text/html');
        } else {
            const [input1, input2, inputSublink, inputSubconfig] = useridData.split('@split@');
            return getResponse(renderForm(userId, await decd(input1, uuid), await decd(input2, uuid), inputSublink, inputSubconfig), 'text/html');
        }
    }

    const [encInput1, encInput2 ,sublink, subconfig] = useridData.split('@split@');

    const basePathMap = {
        "x": `${sublink}/xray?config=`,
        "c": `${sublink}/clash?config=`,
        "s": `${sublink}/singbox?config=`
    };

    if (!useridData) {
        const randomSubscriptions = Array.from({ length: randomNum }, () =>
            `vless://${uuid}@hk-work.lxmoon.eu.org:443?encryption=none&security=tls&sni=hk-work.lxmoon.eu.org&fp=randomized&type=ws&host=hk-work.lxmoon.eu.org&path=%2F%3Fed%3D2048#hk-work.lxmoon.eu.org`
        );
        input1 = randomSubscriptions.join("\n");
        input2 = '';
    } else {

        input1 = await decd(encInput1, uuid);
        input2 = await decd(encInput2, uuid);
    }

    const responsePath = basePathMap[path[1]];
    if (responsePath) {
        return getResponse(await fetchXrayText(responsePath, input1, input2, subconfig));
    } else {
        return getResponse(`${input1}\n${input2}`);
    }
}

//按照userid生成固定的随机uuid和数字
async function Random_UUID_Number(userId, min = 0, max = 100) {
    const encoder = new TextEncoder();
    const data = encoder.encode(userId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // 生成 UUID-like 格式（8-4-4-4-12）
    const uuid = `${hashArray.slice(0, 4).map(toHex).join('')}-${hashArray.slice(4, 6).map(toHex).join('')}-${hashArray.slice(6, 8).map(toHex).join('')}-${hashArray.slice(8, 10).map(toHex).join('')}-${hashArray.slice(10, 16).map(toHex).join('')}`;

    // 生成范围 [min, max] 的固定随机数
    const hashInt = hashArray.reduce((acc, byte) => acc * 256 + byte, 0);
    const randomNum = min + (hashInt % (max - min + 1));

    return { uuid, randomNum };
}

// 将字节转换为两位的十六进制字符串
function toHex(byte) {
    return byte.toString(16).padStart(2, '0');
}

// 创建一个响应对象的辅助函数，便于设置内容、类型和状态码
const getResponse = (content, type = 'text/plain', status = 200) =>
    new Response(content, { headers: { 'Content-Type': `${type}; charset=utf-8` }, status });

// 渲染表单的函数，接受用户ID和两个输入框的内容
const renderForm = (userId = '', input1 = '', input2 = '', inputSublink = '', inputSubconfig = '') => `
    <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * { 
                    box-sizing: border-box; 
                }
                body { 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    background-color: #f0f4f8; 
                    font-family: 'Helvetica Neue', Arial, sans-serif; 
                    margin: 0; 
                }
                .container { 
                    text-align: center; 
                    background: #ffffff; 
                    padding: 40px 30px; 
                    border-radius: 12px; 
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); 
                    width: 90%; 
                    max-width: 600px; 
                }
                h1 { 
                    color: #333; 
                    font-size: 24px; 
                    margin-bottom: 20px; 
                }
                label { 
                    display: block; 
                    font-weight: bold; 
                    color: #555; 
                    margin-top: 15px; 
                }
                input[type="text"], 
                textarea { 
                    width: 100%; 
                    padding: 12px; 
                    margin-top: 8px; 
                    margin-bottom: 20px; 
                    border: 1px solid #ccc; 
                    border-radius: 6px; 
                    font-size: 16px; 
                    transition: border-color 0.3s ease-in-out; 
                }
                input[type="text"]:focus, 
                textarea:focus { 
                    border-color: #66afe9; 
                    outline: none; 
                }
                textarea { 
                    min-height: 120px; 
                    resize: none; 
                    overflow-y: hidden; 
                    overflow-x: auto; 
                    white-space: nowrap; 
                }
                input[type="submit"], 
                button { 
                    background-color: #007BFF; 
                    color: white; 
                    padding: 12px 25px; 
                    border: none; 
                    border-radius: 6px; 
                    font-size: 16px; 
                    font-weight: bold; 
                    cursor: pointer; 
                    transition: background-color 0.3s ease; 
                }
                input[type="submit"]:hover { 
                    background-color: #0056b3; 
                }
                button { 
                    background-color: #dc3545; 
                }
                button:hover { 
                    background-color: #c82333; 
                }
            </style>
            <script>
                // 设置表单的提交地址,基于用户ID动态改变
                function setFormAction() {
                    const userId = document.getElementById('userId').value;
                    if (userId) {
                        document.getElementById('form').action = '/' + userId + '/manage';
                    }
                }

                // 删除用户的函数,确认后发送DELETE请求
                function deleteUser(userId) {
                    if (confirm('确定要删除该用户吗？')) {
                        fetch('/' + userId + '/delete', { method: 'DELETE' })
                            .then(response => response.text())
                            .then(data => {
                                alert(data);
                                window.location.href = '/';
                            });
                    }
                }

                // 自适应调整文本区域的高度
                function autoResizeTextarea(textarea) {
                    textarea.style.height = 'auto'; // 重置高度
                    textarea.style.height = textarea.scrollHeight + 'px'; // 设置为内容高度
                }

                // 页面加载完成后，给输入框添加事件监听
                document.addEventListener("DOMContentLoaded", () => {
                    ['input1', 'input2'].forEach(id => {
                        const textarea = document.getElementById(id);
                        textarea.addEventListener('input', () => autoResizeTextarea(textarea));
                        autoResizeTextarea(textarea);
                    });
                });
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
                
                <label for="inputSublink">Sublink:</label>
                <input type="text" id="inputSublink" name="inputSublink" value="${inputSublink}" placeholder="输入Sublink URL">
                
                <label for="inputSubconfig">Subconfig:</label>
                <textarea id="inputSubconfig" name="inputSubconfig" placeholder="在此输入Subconfig配置">${inputSubconfig}</textarea>
                
                <input type="submit" value="提交">
                <button type="button" onclick="deleteUser('${userId}')">删除</button>
            </form>
        </div>
    </body>
    </html>
`;

async function findUserId(targetUserId, uuid) {
    if (targetUserId === "") {
        return "";
    }
    
    let cursor = null;
    do {
        const keysList = await mixproxy.list({ cursor });
        if (keysList.keys.length === 0) break;

        try {
            // 使用 Promise.all 并发解密 keys
            const decryptedResults = await Promise.all(
                keysList.keys.map(async (key) => {
                    try {
                        return { name: key.name, decrypted: await decd(key.name, uuid) };
                    } catch (error) {
                        return null; // 忽略解密失败的情况
                    }
                })
            );

            // 检查解密结果是否匹配 targetUserId
            for (const result of decryptedResults) {
                if (result && result.decrypted === targetUserId) {
                    return result.name;
                }
            }
        } catch (error) {
            // 忽略处理解密结果时的异常
        }

        cursor = keysList.cursor;
    } while (cursor);

    return "";
}

async function fetchXrayText(baseURL, text1, text2, subconfig) {
    // 拼接两个文本
    const combinedText = `${text1}\n${text2}`;
  
    // 对拼接后的文本进行 URL 编码
    const encodedText = encodeURIComponent(combinedText);
  
    // 构建完整的 URL
    const fullUrl = `${baseURL}${encodedText}${subconfig}`;
  
    // 发起请求并获取返回内容
    const response = await fetch(fullUrl);
    const xraytext = await response.text();
  
    return xraytext; // 返回请求到的内容
  }

  async function encd(plaintext, uuid) {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 生成 12 字节的初始化向量 (IV)
    const encoder = new TextEncoder();
    
    // 使用 SHA-256 对 UUID 进行哈希，生成 256 位密钥
    const uuidHash = await crypto.subtle.digest('SHA-256', encoder.encode(uuid));
    const key = await crypto.subtle.importKey(
      'raw',
      uuidHash,
      'AES-GCM',
      false,
      ['encrypt']
    );
  
    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoder.encode(plaintext)
    );
  
    // 将 IV 和加密内容组合成字符串，方便传输
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const encryptedText = btoa(String.fromCharCode(...new Uint8Array(encryptedContent)));
    return `${ivHex}:${encryptedText}`;
  }

async function decd(encryptedText, uuid) {
    const [ivHex, encryptedContent] = encryptedText.split(':');
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();
  
    // 使用 SHA-256 对 UUID 进行哈希，生成 256 位密钥
    const uuidHash = await crypto.subtle.digest('SHA-256', encoder.encode(uuid));
    const key = await crypto.subtle.importKey(
      'raw',
      uuidHash,
      'AES-GCM',
      false,
      ['decrypt']
    );
  
    const encryptedBuffer = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0));
    const decryptedContent = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedBuffer
    );
  
    return new TextDecoder().decode(decryptedContent);
  }
