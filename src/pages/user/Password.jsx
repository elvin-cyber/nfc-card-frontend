import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import { api } from "../../services/api";

export default function Password(){
  const [passwords,setPasswords]=useState({currentPassword:"",newPassword:"",confirmPassword:""});
  const [show,setShow]=useState(false);
  const [saving,setSaving]=useState(false);
  const submit=async e=>{
    e.preventDefault();
    if(passwords.newPassword!==passwords.confirmPassword){window.dispatchEvent(new CustomEvent("nfc:toast",{detail:{message:"New passwords do not match.",type:"error"}}));return;}
    setSaving(true);
    try{await api.changePassword(passwords);setPasswords({currentPassword:"",newPassword:"",confirmPassword:""});window.dispatchEvent(new CustomEvent("nfc:toast",{detail:{message:"Password changed successfully.",type:"success"}}));}
    catch{} finally{setSaving(false);}
  };
  return <Layout><PageHeader eyebrow="ACCOUNT SECURITY" title="Password" description="Change the password provided by your administrator or update your current password."/>
    <section className="panel password-panel"><div className="panel-heading"><div><h2>Change password</h2><p>Use a strong password that you do not reuse elsewhere.</p></div><div className="section-icon"><KeyRound size={19}/></div></div>
      <form className="form-grid password-grid" onSubmit={submit}>
        <label className="field"><span>Current password</span><div className="password-field"><input type={show?"text":"password"} required value={passwords.currentPassword} onChange={e=>setPasswords({...passwords,currentPassword:e.target.value})}/><button type="button" onClick={()=>setShow(v=>!v)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
        <label className="field"><span>New password</span><input type="password" minLength="8" required value={passwords.newPassword} onChange={e=>setPasswords({...passwords,newPassword:e.target.value})}/></label>
        <label className="field"><span>Confirm new password</span><input type="password" minLength="8" required value={passwords.confirmPassword} onChange={e=>setPasswords({...passwords,confirmPassword:e.target.value})}/></label>
        <div className="form-actions"><button className="btn btn-primary" disabled={saving}><KeyRound size={16}/>{saving?"Saving…":"Change password"}</button></div>
      </form>
    </section>
  </Layout>;
}
