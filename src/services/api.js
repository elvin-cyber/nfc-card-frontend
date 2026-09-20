const API_BASE=(import.meta.env.VITE_API_BASE_URL||"http://localhost:5000/api").replace(/\/$/,"");
async function request(path,options={}){
  const {suppressToast,...fetchOptions}=options;
  try{
    const token=typeof window!=="undefined"?window.sessionStorage.getItem("nfc_access_token"):"";
    const response=await fetch(`${API_BASE}${path}`,{credentials:"include",...fetchOptions,headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{}) ,...(options.headers||{})}});
const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data={message:text}}if(!response.ok)throw new Error(data?.message||data?.error||`Request failed: ${response.status}`);return data;}catch(error){if(typeof window!=="undefined" && !suppressToast)window.dispatchEvent(new CustomEvent("nfc:toast",{detail:{message:error.message||"Request failed",type:"error"}}));throw error;}}
export const api={
 signup:async b=>{const r=await request("/auth/signup",{method:"POST",body:JSON.stringify(b)});if(r?.accessToken||r?.token){window.sessionStorage.setItem("nfc_access_token",r.accessToken||r.token);window.sessionStorage.setItem("nfc_auth_kind","user")}return r},
 login:async b=>{const r=await request("/auth/login",{method:"POST",body:JSON.stringify(b)});if(r?.accessToken||r?.token){window.sessionStorage.setItem("nfc_access_token",r.accessToken||r.token);window.sessionStorage.setItem("nfc_auth_kind","user")}return r},
 me:(options={})=>request("/auth/me",options),
 logout:async()=>{try{return await request("/auth/logout",{method:"POST"})}finally{window.sessionStorage.removeItem("nfc_access_token");window.sessionStorage.removeItem("nfc_auth_kind")}},
 adminLogin:async b=>{const r=await request("/admin/auth/login",{method:"POST",body:JSON.stringify(b)});if(r?.accessToken||r?.token){window.sessionStorage.setItem("nfc_access_token",r.accessToken||r.token);window.sessionStorage.setItem("nfc_auth_kind","admin")}return r},
 adminMe:(options={})=>request("/admin/auth/me",options),
 adminLogout:async()=>{try{return await request("/admin/auth/logout",{method:"POST"})}finally{window.sessionStorage.removeItem("nfc_access_token");window.sessionStorage.removeItem("nfc_auth_kind")}},
 getProfile:()=>request("/profile"),updateProfile:b=>request("/profile",{method:"PUT",body:JSON.stringify(b)}),getCards:()=>request("/cards"),createCard:b=>request("/cards",{method:"POST",body:JSON.stringify(b)}),updateCard:(id,b)=>request(`/cards/${id}`,{method:"PUT",body:JSON.stringify(b)}),enableCard:id=>request(`/cards/${id}/enable`,{method:"PATCH"}),disableCard:id=>request(`/cards/${id}/disable`,{method:"PATCH"}),deleteCard:id=>request(`/cards/${id}`,{method:"DELETE",suppressToast:true}),
changePassword:b=>request("/profile/password",{method:"PUT",body:JSON.stringify(b)}),
getPublicCard:t=>request(`/public/cards/${encodeURIComponent(t)}`),
 adminUsers:()=>request("/admin/users"),adminUser:id=>request(`/admin/users/${id}`),createAdminUser:b=>request("/admin/users",{method:"POST",body:JSON.stringify(b)}),updateAdminUser:(id,b)=>request(`/admin/users/${id}`,{method:"PUT",body:JSON.stringify(b)}),disableAdminUser:id=>request(`/admin/users/${id}/disable`,{method:"PATCH"}),enableAdminUser:id=>request(`/admin/users/${id}/enable`,{method:"PATCH"}),deleteAdminUser:id=>request(`/admin/users/${id}`,{method:"DELETE"}),adminCards:()=>request("/admin/cards"),issueAdminCard:b=>request("/admin/cards",{method:"POST",body:JSON.stringify(b)}),adminDeleteCard:id=>request(`/admin/cards/${id}`,{method:"DELETE"}),adminUpdateCard:(id,b)=>request(`/admin/cards/${id}`,{method:"PUT",body:JSON.stringify(b)}),adminDisableCard:id=>request(`/admin/cards/${id}/disable`,{method:"PATCH"}),adminEnableCard:id=>request(`/admin/cards/${id}/enable`,{method:"PATCH"}),
disableUser:id=>request(`/admin/users/${id}/disable`,{method:"PATCH"}),
enableUser:id=>request(`/admin/users/${id}/enable`,{method:"PATCH"})
};
