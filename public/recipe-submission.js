(function () {
  var root = document.querySelector('.recipe-submission')
  if (!root) return
  var form = root.querySelector('form')
  var ingredients = root.querySelector('[data-ingredients]')
  var steps = root.querySelector('[data-steps]')
  var error = root.querySelector('.recipe-submission__error')
  var success = root.querySelector('.recipe-submission__success')
  var submit = form.querySelector('[type="submit"]')
  var sending = false
  var sequence = 0

  function renumber(container, label) {
    var rows = container.querySelectorAll('[data-row]')
    rows.forEach(function (row, index) {
      row.querySelector('[data-title]').textContent = label + ' ' + (index + 1)
      var remove = row.querySelector('[data-remove]')
      remove.hidden = rows.length === 1
      remove.setAttribute('aria-label', label + ' ' + (index + 1) + ' verwijderen')
    })
  }

  function addRow(container, kind, focus) {
    var row = document.createElement('div')
    var label = kind === 'ingredient' ? 'Ingrediënt' : 'Stap'
    var id = 'recipe-row-' + (++sequence)
    row.className = 'recipe-submission__row'
    row.dataset.row = kind
    row.setAttribute('role', 'group')
    row.setAttribute('aria-labelledby', id)
    // Alleen vaste markup; invoer van bezoekers wordt nooit als HTML ingevoegd.
    row.innerHTML = '<p class="recipe-submission__row-title" data-title id="' + id + '"></p>' + (kind === 'ingredient'
      ? '<div class="recipe-submission__columns"><label>Hoeveelheid<input data-field="hoeveelheid" type="number" min="0" max="100000" step="any" placeholder="Bijv. 200" /></label><label>Eenheid<input data-field="eenheid" maxlength="40" placeholder="Bijv. g, ml, el" /></label></div><label>Ingrediënt *<input data-field="ingredient" required maxlength="200" placeholder="Bijv. bloem" /></label><label>Toelichting (optioneel)<input data-field="toelichting" maxlength="300" placeholder="Bijv. fijngesneden of naar smaak" /></label>'
      : '<label>Wat doe je in deze stap? *<textarea data-field="stap" rows="3" required maxlength="3000"></textarea></label>') +
      '<button type="button" class="recipe-submission__remove" data-remove>Verwijderen</button>'
    row.querySelector('[data-remove]').addEventListener('click', function () {
      var next = row.nextElementSibling || row.previousElementSibling
      row.remove()
      renumber(container, label)
      if (next) next.querySelector('input, textarea').focus()
    })
    container.appendChild(row)
    renumber(container, label)
    if (focus) row.querySelector(kind === 'ingredient' ? '[data-field="ingredient"]' : 'textarea').focus()
  }

  root.querySelector('[data-add-ingredient]').addEventListener('click', function () {
    if (ingredients.children.length < 100) addRow(ingredients, 'ingredient', true)
  })
  root.querySelector('[data-add-step]').addEventListener('click', function () {
    if (steps.children.length < 100) addRow(steps, 'step', true)
  })
  addRow(ingredients, 'ingredient', false)
  addRow(steps, 'step', false)
  form.hidden = false

  function rows(container) {
    return Array.from(container.querySelectorAll('[data-row]')).map(function (row) {
      var result = {}
      row.querySelectorAll('[data-field]').forEach(function (input) {
        result[input.dataset.field] = input.type === 'number'
          ? (input.value === '' ? null : Number(input.value))
          : input.value.trim()
      })
      return result
    })
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault()
    if (sending || !form.reportValidity()) return
    var fields = {}
    new FormData(form).forEach(function (value, key) { fields[key] = String(value).trim() })
    fields.ingredienten = JSON.stringify(rows(ingredients))
    fields.bereiding = JSON.stringify(rows(steps))
    fields.toestemming = 'Ja'
    fields.inzendpagina = '/recept-insturen'
    if (!fields.naam || !fields.titel || !fields.intro ||
        rows(ingredients).some(function (row) { return !row.ingredient }) ||
        rows(steps).some(function (row) { return !row.stap })) {
      error.textContent = 'Vul de verplichte velden in; alleen spaties zijn niet voldoende.'
      error.hidden = false
      return
    }
    sending = true
    submit.disabled = true
    submit.textContent = 'Versturen…'
    error.hidden = true
    // De bestaande gepubliceerde CMS-homepage registreert het formulier. De zichtbare
    // pagina is statisch; formKey onderscheidt deze inzendingen van andere formulieren.
    fetch(root.dataset.apiBase.replace(/\/$/, '') + '/api/public/forms/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': root.dataset.tenantSlug },
      body: JSON.stringify({ pageSlug: 'home', formKey: 'recept-inzending', formTitle: 'Recept insturen', fields: fields }),
      signal: AbortSignal.timeout(15000)
    }).then(function (response) {
      if (!response.ok) throw new Error('Versturen mislukt')
      form.hidden = true
      success.hidden = false
      success.focus()
    }).catch(function () {
      error.textContent = 'Je inzending kon niet worden bevestigd. Je invoer blijft staan. Probeer het later opnieuw.'
      error.hidden = false
    }).finally(function () {
      sending = false
      submit.disabled = false
      submit.textContent = 'Recept insturen'
    })
  })
})()
