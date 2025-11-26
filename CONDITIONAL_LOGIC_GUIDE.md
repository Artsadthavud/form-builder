# 🎯 Conditional Logic Guide

## Overview
Conditional Logic allows you to show or hide form fields based on user responses to previous fields. This creates dynamic, personalized forms that adapt to user input.

## ✨ Features

### 🎨 Visual Logic Builder
- Beautiful, intuitive modal interface
- Drag-and-drop condition creation
- Real-time logic preview
- Color-coded visual feedback

### 🔧 Supported Element Types
**ALL element types** can have conditional logic:
- ✅ Text inputs (text, email, phone, number, textarea)
- ✅ Selection fields (radio, checkbox, select)
- ✅ Special fields (date, time, file, rating, signature)
- ✅ Content elements (section, paragraph, image)

### 📋 Condition Operators
- **equals** - Exact match
- **not equals** - Not matching
- **contains** - Contains text (case-insensitive)
- **not contains** - Does not contain text

### 🔗 Logic Combinators
- **AND** - All conditions must be true
- **OR** - Any condition can be true

## 🚀 How to Use

### Step 1: Create Your Form
Add multiple fields to your form. Remember: you can only create conditions based on fields that appear **before** the current field.

### Step 2: Open Logic Builder
1. Select the field you want to add logic to
2. Scroll down to **"Conditional Logic"** section in Properties Panel
3. Click **"Create Logic Rules"** button

### Step 3: Choose Action
Select whether the field should be:
- **Show Field** - Display when conditions are met
- **Hide Field** - Hide when conditions are met

### Step 4: Add Conditions
1. Click **"Add Condition"** button
2. Select the target field
3. Choose an operator
4. Enter the value to check against
5. Add more conditions if needed

### Step 5: Set Combinator
If you have multiple conditions:
- Choose **AND** if all conditions must be true
- Choose **OR** if any condition can be true

### Step 6: Save
Click **"Save Logic"** to apply your rules.

## 📖 Examples

### Example 1: Basic Show/Hide
**Scenario:** Show "Company Name" field only if user selects "Employed" in "Employment Status"

```
Field 1: Employment Status (radio)
  Options: Employed, Unemployed, Student

Field 2: Company Name (text)
  Logic: SHOW when
    - Employment Status equals "Employed"
```

### Example 2: Multiple Conditions (AND)
**Scenario:** Show "Discount Code" only if user is both a student AND under 25

```
Field 1: Are you a student? (radio: Yes, No)
Field 2: Age (number)
Field 3: Discount Code (text)
  Logic: SHOW when ALL:
    - Are you a student? equals "Yes"
    - Age less than or equals "25"
```

### Example 3: Multiple Conditions (OR)
**Scenario:** Show "Priority Support" if user is VIP OR spent over $1000

```
Field 1: Customer Type (select: Regular, VIP, Partner)
Field 2: Total Spent (number)
Field 3: Priority Support (checkbox)
  Logic: SHOW when ANY:
    - Customer Type equals "VIP"
    - Customer Type equals "Partner"
```

### Example 4: Nested/Complex Logic
**Scenario:** Show "Reason for Leaving" if resignation or dissatisfaction

```
Field 1: Job Satisfaction (rating 1-5)
Field 2: Planning to Leave? (radio: Yes, No, Maybe)
Field 3: Reason for Leaving (textarea)
  Logic: SHOW when ANY:
    - Job Satisfaction equals "1"
    - Job Satisfaction equals "2"
    - Planning to Leave? equals "Yes"
```

## 💡 Best Practices

### 1. **Order Matters**
- Place conditional fields AFTER their trigger fields
- You cannot reference fields that come later in the form

### 2. **Keep It Simple**
- Use clear, descriptive field labels
- Don't create overly complex logic chains
- Test your logic in Preview mode

### 3. **User Experience**
- Use SHOW for positive actions (reveal relevant fields)
- Use HIDE for negative actions (remove irrelevant fields)
- Provide clear feedback to users

### 4. **Testing**
- Always test your logic in Preview mode
- Try different combinations
- Check edge cases

## 🎨 UI Elements

### Canvas Indicators
Fields with logic show a purple badge with the number of rules:
- 🟣 **Purple badge** - Conditional logic active
- **Number** - Count of conditions
- **Hover** - Shows logic summary

### Properties Panel
The Conditional Logic section shows:
- 📊 **Logic Summary** - Overview of rules
- 🎯 **Action Type** - Show or Hide
- 🔗 **Combinator** - AND or OR
- 📝 **Condition List** - All active rules

### Logic Builder Modal
- 🎨 **Color-coded actions** - Green (Show), Red (Hide)
- 🔢 **Numbered conditions** - Easy to track
- 📋 **Live preview** - See logic as you build
- 💾 **Auto-save** - Changes saved on click

## 🔍 Troubleshooting

### Logic Not Working?
1. Check field order (trigger must be before target)
2. Verify operator and values match exactly
3. Test in Preview mode, not in Builder
4. Check combinator (AND vs OR)

### Can't See a Field in Dropdown?
- Field must appear BEFORE the current field
- Image and Paragraph fields cannot be conditions
- Section fields can have logic but cannot be condition targets

### Value Not Matching?
- Check for exact spelling and case
- Use "contains" for partial matches
- For checkboxes, value is an array

## 🚀 Advanced Tips

### Checkbox Values
Checkboxes store selected values as arrays. Use:
- **contains** - Check if specific option is selected
- **equals** - Match exact selection (less flexible)

### Empty/No Response
- Use **not equals** with empty value
- Use **not contains** for partial absence

### Multiple Dependent Fields
Create chains:
1. Field A triggers Field B
2. Field B (if visible) triggers Field C
3. Maximum 10 iterations for safety

## 📱 Mobile Considerations
- Logic works on all devices
- Touch-friendly condition builder
- Responsive design
- Same behavior across platforms

## ♿ Accessibility
- Keyboard navigation supported
- Screen reader compatible
- Focus management
- Clear visual indicators

---

## 🎯 Summary

Conditional Logic transforms static forms into intelligent, adaptive experiences:
- ✅ Works with ALL field types
- ✅ Visual builder interface
- ✅ Multiple conditions with AND/OR
- ✅ Real-time preview
- ✅ Easy to test and modify

Start creating smarter forms today! 🚀
