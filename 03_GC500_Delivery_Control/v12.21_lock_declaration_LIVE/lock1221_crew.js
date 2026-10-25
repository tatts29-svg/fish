/* Author: Andrew Fisher. Explicit confirmation before a new physical door-lock completion. */
var lockReady1221=load('lock-capability1221',false)===true;
function declareLock1221(key) {
  if(!lockReady1221){say('Door-lock declaration saving is not ready. Keep this page open with signal.');return;}
  if(document.getElementById('lock1221-dialog'))return;
  var lineId=key.split('|')[0],line=LINE[lineId],ref=curRef,day=drawnDay,crew=selectedCrew1173;
  var label=SvcCrews1173.label(D,crew),el=document.createElement('dialog');el.id='lock1221-dialog';
  el.setAttribute('aria-labelledby','lock1221-title');el.setAttribute('aria-describedby','lock1221-statement');
  el.innerHTML='<form><h2 id="lock1221-title">Confirm doors locked</h2><p id="lock1221-statement">'+esc(SvcLock1221.statement)+'</p><div class="lock1221-cover"><b>'+esc(ref)+' · '+esc(words1146(line))+'</b><br>'+esc(line.qty)+' unit(s)'+(line.label?'<br>'+esc(line.label):'')+(line.nos&&line.nos.length?'<br>Asset nos: '+esc(line.nos.join(', ')):'')+'</div><p><b>Group:</b> '+esc(label)+'</p><label for="lock1221-name">Your name (person confirming)</label><input id="lock1221-name" name="confirmer" maxlength="100" required autocomplete="name" placeholder="Your name"><label class="lock1221-check"><input id="lock1221-agree" type="checkbox" required> I confirm this declaration for all the units listed above.</label><p id="lock1221-error" role="alert"></p><div class="lock1221-actions"><button type="button" data-lock1221-cancel>Cancel</button><button type="submit">Confirm doors locked</button></div></form>';
  function close(){if(el.close)el.close();el.remove();refocus('j-'+key);}
  el.querySelector('[data-lock1221-cancel]').onclick=close;
  el.addEventListener('cancel',function(e){e.preventDefault();close();});
  el.querySelector('form').onsubmit=function(e){
    e.preventDefault();var d={version:1,by:el.querySelector('#lock1221-name').value.trim(),crew:label,units:line.qty};
    if(!el.querySelector('#lock1221-agree').checked||!SvcLock1221.valid(d)){el.querySelector('#lock1221-error').textContent='Enter your name and confirm the declaration.';return;}
    if(curRef!==ref||shownDay()!==day||drawnDay!==day||selectedCrew1173!==crew||!lockReady1221){close();say('The reference, service day or crew changed. Check the job and confirm again.');return;}
    close();tapJob(key,d);
  };
  document.body.appendChild(el);if(el.showModal)el.showModal();else el.setAttribute('open','');
  el.querySelector('#lock1221-name').focus();
}
