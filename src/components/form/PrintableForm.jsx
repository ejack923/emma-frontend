import React from 'react';

export default function PrintableForm({ formData, applicationId }) {
  const renderField = (label, value) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
    return (
      <div className="vla-form-field">
        <label>{label}</label>
        <div>{displayValue}</div>
      </div>
    );
  };

  const renderCheckbox = (label, checked) => {
    return (
      <div className="vla-checkbox">
        <input type="checkbox" checked={checked} readOnly disabled />
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div className="vla-print-document" style={{ display: 'none' }}>
      {/* Header */}
      <div className="vla-print-header">
        <h1>Application for Grant of Legal Assistance</h1>
        <p>Victoria Legal Aid</p>
      </div>

      {/* Section 1: Personal Details */}
      <div className="vla-section-header">1. Personal Details</div>
      <div className="vla-form-content">
        <div className="vla-form-row">
          {renderField('Title', formData.title)}
          {renderField('First name', formData.first_name)}
        </div>
        <div className="vla-form-row">
          {renderField('Middle name', formData.middle_name)}
          {renderField('Last name', formData.last_name)}
        </div>
        <div className="vla-form-row">
          {renderField('Gender', formData.gender)}
          {renderField('Date of birth', formData.date_of_birth)}
        </div>
        {renderField('Home address', formData.home_address)}
        {renderField('Postal address', formData.postal_address)}
        <div className="vla-form-row">
          {renderCheckbox('Homeless', formData.homeless === 'Yes')}
          {renderCheckbox('Prefer email contact', formData.contact_email_pref === 'Yes')}
        </div>
        {renderField('Email', formData.email)}
        <div className="vla-form-row">
          {renderField('Home phone', formData.home_phone)}
          {renderField('Mobile phone', formData.mobile_phone)}
        </div>
      </div>

      {/* Section 2: Additional Details */}
      <div className="vla-section-header">2. Additional Details</div>
      <div className="vla-form-content">
        {renderField('Other names used', formData.other_names_list)}
        {renderField('Country of birth', formData.country_of_birth)}
        {renderField('Year arrived in Australia', formData.arrival_year)}
        {renderField('Aboriginal/TSI origin', formData.atsi_origin)}
      </div>

      {/* Section 3: Language */}
      <div className="vla-section-header">4. Language</div>
      <div className="vla-form-content">
        {renderField('Other languages spoken', formData.other_languages)}
        {renderField('English proficiency', formData.english_level)}
        <div className="vla-checkbox-group">
          {renderCheckbox('Needs interpreter', formData.needs_interpreter === 'Yes')}
        </div>
        {renderField('Interpreter language', formData.interpreter_language)}
      </div>

      {/* Section 4: Disability */}
      <div className="vla-section-header">5. Disability and Mental Health</div>
      <div className="vla-form-content">
        <div className="vla-checkbox-group">
          {renderCheckbox('Has disability', formData.disability_status === 'Yes')}
        </div>
        {renderField('Disability types', formData.disability_types)}
        {renderField('Support required', formData.support_required)}
      </div>

      {/* Section 5: Employment */}
      <div className="vla-section-header">7. Employment Status</div>
      <div className="vla-form-content">
        {renderField('Employment status', formData.employment_status)}
      </div>

      {/* Section 6: Benefits */}
      <div className="vla-section-header">8. Benefit Details</div>
      <div className="vla-form-content">
        {renderField('Receives Centrelink benefit', formData.receives_benefit)}
        {renderField('Centrelink reference', formData.centrelink_reference)}
        {renderField('Benefit types', formData.benefit_types)}
        {renderField('Maximum benefit rate', formData.max_benefit_rate)}
      </div>

      {/* Section 7: Custody */}
      <div className="vla-section-header">9. Custody Details</div>
      <div className="vla-form-content">
        {renderField('Currently in custody', formData.currently_in_custody)}
        {renderField('Custody facility', formData.custody_facility)}
        {renderField('Date remanded', formData.custody_date)}
      </div>

      {/* Section 8: Relationship */}
      <div className="vla-section-header">10. Relationship Status</div>
      <div className="vla-form-content">
        {renderField('Relationship status', formData.relationship_status)}
        {renderField('Family violence', formData.family_violence)}
      </div>

      {/* Section 9: Partner */}
      <div className="vla-section-header">12. Partner Details</div>
      <div className="vla-form-content">
        {renderField('Has partner', formData.has_partner)}
        {renderField('Partner receives benefit', formData.partner_benefit)}
        {renderField('Partner benefit types', formData.partner_benefit_types)}
      </div>

      {/* Section 10: Dependants */}
      <div className="vla-section-header">13. Dependant Details</div>
      <div className="vla-form-content">
        {renderField('Has dependants', formData.has_dependants)}
        {formData.dependants && formData.dependants.length > 0 && (
          <div>
            {formData.dependants.map((dep, idx) => (
              <div key={idx} style={{ marginBottom: '10px' }}>
                {renderField(`Dependant ${idx + 1} - Name`, `${dep.first_name || ''} ${dep.last_name || ''}`.trim())}
                {renderField(`Dependant ${idx + 1} - Relationship`, dep.relationship)}
                {renderField(`Dependant ${idx + 1} - DOB`, dep.dob)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 11: Income */}
      <div className="vla-section-header">14. Your Income (Before Tax)</div>
      <div className="vla-form-content">
        {renderField('Pensions/benefits', formData.income_pensions_you)}
        {renderField('Employment income', formData.income_employment_you)}
        {renderField('Business income', formData.income_business_you)}
        {renderField('Child support income', formData.income_child_support_you)}
        {renderField('Total income', formData.income_total_you)}
      </div>

      {/* Section 12: Expenses */}
      <div className="vla-section-header">15. Expenses</div>
      <div className="vla-form-content">
        {renderField('Rent', formData.expense_rent_you)}
        {renderField('Mortgage', formData.expense_mortgage_you)}
        {renderField('Child care', formData.expense_childcare_you)}
        {renderField('Total expenses', formData.expense_total_you)}
      </div>

      {/* Section 13: Assets */}
      <div className="vla-section-header">16. Assets</div>
      <div className="vla-form-content">
        {renderField('Home value', formData.asset_home_you)}
        {renderField('Cash/savings', formData.asset_cash_you)}
        {renderField('Total assets', formData.asset_total_you)}
        {renderField('Is homeowner', formData.is_homeowner)}
        {renderField('Property address', formData.property_address)}
      </div>

      {/* Section 14: Court */}
      <div className="vla-section-header">18. Court Hearings</div>
      <div className="vla-form-content">
        {renderField('Has proceedings', formData.has_proceedings)}
        {renderField('Hearing date', formData.hearing_date)}
        {renderField('Court/tribunal', formData.court_tribunal)}
        {renderField('Your role', formData.proceedings_role)}
        {renderField('Hearing type', formData.hearing_type)}
      </div>

      {/* Section 15: Lawyer */}
      <div className="vla-section-header">20. Your Lawyer</div>
      <div className="vla-form-content">
        {renderField('Lawyer name', formData.lawyer_name)}
        {renderField('Law firm', formData.lawyer_firm)}
        {renderField('Lawyer contact', formData.lawyer_contact)}
      </div>

      {/* Section 16: Legal Problem */}
      <div className="vla-section-header">21. Your Legal Problem</div>
      <div className="vla-form-content">
        {renderField('Type of law', formData.vla_guideline)}
        {renderField('Legal problem description', formData.legal_problem_description)}
        {renderField('Application merits', formData.application_merits)}
        {renderField('Detriment if refused', formData.applicant_detriment)}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '40px', fontSize: '10px', textAlign: 'center', color: '#666' }}>
        <p>Reference ID: {applicationId}</p>
        <p>Submitted: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}