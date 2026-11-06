/* Author: Andrew Fisher. Explicit selection on each reference; no phone-wide inferred identity. */
var selectedCrew1173='',crewReady1173=load('crew-capability1173',false)===true;
function crewSelector1173() {
  var groups=SvcCrews1173.choices(D);
  return '<div class="crew1173"><label for="crew1173-choice">Who completed this work?</label><select id="crew1173-choice" aria-describedby="crew1173-help"><option value="">Select your crew group</option>'+groups.map(function(g){return '<option value="'+esc(g.id)+'"'+(selectedCrew1173===g.id?' selected':'')+'>'+esc(g.label)+'</option>';}).join('')+'</select><p id="crew1173-help">Choose your group, then tap each job you have completed. This choice is saved against each job.</p>'+(!crewReady1173?'<p role="status">Waiting for the service to confirm crew-group saving. Keep this page open with signal.</p>':'')+'</div>';
}
document.addEventListener('change',function(e){if(e.target.id==='crew1173-choice'){selectedCrew1173=SvcCrews1173.choices(D).some(function(g){return g.id===e.target.value;})?e.target.value:'';render();}});
