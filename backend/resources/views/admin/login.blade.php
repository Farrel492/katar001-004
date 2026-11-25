<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Login Admin – Karang Taruna</title>
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {font-family: Arial, sans-serif; background:#f5f5f5; display:flex; align-items:center; justify-content:center; height:100vh;}
        .login-box {background:#fff; padding:2rem; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.1); width:320px;}
        .login-box h2 {margin-bottom:1rem; font-size:1.5rem; text-align:center;}
        .login-box input {width:100%; padding:.5rem; margin-bottom:.75rem; border:1px solid #ccc; border-radius:4px;}
        .login-box button {width:100%; padding:.6rem; background:#2A5FE0; color:#fff; border:none; border-radius:4px; cursor:pointer;}
        .login-box button:hover {background:#2549b3;}
        .error {color:#d00; margin-bottom:.5rem;}
    </style>
</head>
<body>
<div class="login-box">
    <h2>Login Admin</h2>
    <div id="error" class="error" style="display:none;"></div>
    <form id="loginForm">
        <input type="text" name="username" placeholder="Username" required autocomplete="off" />
        <input type="password" name="password" placeholder="Password" required autocomplete="off" />
        <button type="submit">Masuk</button>
    </form>
</div>
<script>
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('error');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';
        const data = new FormData(form);
        const payload = {
            username: data.get('username'),
            password: data.get('password')
        };
        try {
            const resp = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const result = await resp.json();
            if (!resp.ok) {
                throw new Error(result.message || 'Login gagal');
            }
            // login berhasil – redirect ke halaman admin default (placeholder)
            window.location.href = '/admin/dashboard';
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
        }
    });
</script>
</body>
</html>
