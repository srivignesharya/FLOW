/**
 * FLOW Powered by IMV — Deadline Reminder HTML Email Template
 * Theme: Orange (#ff7a00), Black (#09090b), White (#ffffff)
 */

export const generateReminderEmailHtml = ({
  userName,
  assignmentTitle,
  subject,
  priority,
  deadlineFormatted,
  estimatedStudyTime,
  dashboardUrl
}) => {
  const priorityColor =
    priority === 'high'
      ? '#ef4444'
      : priority === 'medium'
      ? '#ff7a00'
      : '#10b981';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deadline Reminder — FLOW</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f4f4f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #09090b; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #18181b; border-radius: 16px; border: 1px solid #27272a; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #ff7a00 0%, #18181b 100%); padding: 32px 24px; border-bottom: 1px solid #27272a;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="background-color: #09090b; border: 2px solid #ff7a00; width: 48px; height: 48px; border-radius: 12px; line-height: 48px; text-align: center; color: #ff7a00; font-size: 24px; font-weight: 900; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);">
                      ⚡
                    </div>
                    <div style="font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                      FLOW
                    </div>
                    <div style="font-size: 11px; font-weight: 700; tracking: 1px; color: #ff7a00; text-transform: uppercase; margin-top: 4px;">
                      Powered by IMV
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px; color: #f4f4f5;">
              <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #ffffff;">
                Hello ${userName || 'Student'},
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0 0 28px 0;">
                This is an automated reminder from your FLOW AI agent that your assignment deadline is approaching within the next 24 hours.
              </p>

              <!-- Assignment Info Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #09090b; border-radius: 12px; border: 1px solid #27272a; padding: 24px; margin-bottom: 28px;">
                <tr>
                  <td>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                          Assignment
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 17px; font-weight: 800; color: #ffffff; padding-bottom: 16px;">
                          ${assignmentTitle}
                        </td>
                      </tr>
                    </table>

                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #18181b; padding-top: 16px;">
                      <tr>
                        <td width="50%" valign="top" style="padding-bottom: 12px;">
                          <div style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 600;">Subject</div>
                          <div style="font-size: 13px; font-weight: 700; color: #ff7a00; margin-top: 2px;">${subject}</div>
                        </td>
                        <td width="50%" valign="top" style="padding-bottom: 12px;">
                          <div style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 600;">Priority</div>
                          <div style="font-size: 12px; font-weight: 800; color: ${priorityColor}; text-transform: uppercase; margin-top: 2px;">
                            ${priority} Priority
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" valign="top">
                          <div style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 600;">Deadline</div>
                          <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-top: 2px;">${deadlineFormatted}</div>
                        </td>
                        <td width="50%" valign="top">
                          <div style="font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 600;">Est. Study Time</div>
                          <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-top: 2px;">${estimatedStudyTime}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- AI Recommendation Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255, 122, 0, 0.08); border-left: 4px solid #ff7a00; border-radius: 6px; padding: 16px; margin-bottom: 32px;">
                <tr>
                  <td style="font-size: 13px; line-height: 1.5; color: #f4f4f5;">
                    <strong style="color: #ff7a00;">AI Recommendation:</strong> Start working today to avoid last-minute stress. Check your 7-day Study Planner for your allocated focus blocks.
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #ff7a00 0%, #e06b00 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 32px; border-radius: 10px; border: 1px solid #ff7a00; box-shadow: 0 4px 14px rgba(255, 122, 0, 0.35);">
                      Open FLOW Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #09090b; padding: 24px; border-top: 1px solid #27272a; font-size: 12px; color: #71717a; line-height: 1.5;">
              <div style="font-weight: 800; color: #ffffff; font-size: 13px; letter-spacing: 1px;">FLOW</div>
              <div style="color: #ff7a00; font-weight: 700; font-size: 10px; margin-top: 2px; text-transform: uppercase;">Powered by IMV</div>
              <div style="margin-top: 8px; color: #52525b;">Smart Academic Automation Platform</div>
              <div style="margin-top: 12px; font-size: 10px; color: #3f3f46;">
                You are receiving this automated academic notification based on your stored syllabus commitments.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
