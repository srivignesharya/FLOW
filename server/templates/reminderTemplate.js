/**
 * ZENITH by IMV — Deadline Reminder HTML Email Template
 * Theme: Astronomy Midnight (#0B1020), Surface (#111827), Primary Blue (#2563FF), Accent Cyan (#00D4FF)
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
      ? '#00D4FF'
      : '#10b981';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deadline Reminder — ZENITH by IMV</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B1020; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #F8FAFC;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #0B1020; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #111827; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1D4ED8 0%, #111827 100%); padding: 32px 24px; border-bottom: 1px solid #1E293B;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="background-color: #0B1020; border: 2px solid #2563FF; width: 48px; height: 48px; border-radius: 12px; line-height: 48px; text-align: center; color: #00D4FF; font-size: 22px; font-weight: 900; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(37, 99, 255, 0.35);">
                      ▲
                    </div>
                    <div style="font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #F8FAFC; text-transform: uppercase;">
                      ZENITH
                    </div>
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #00D4FF; text-transform: uppercase; margin-top: 4px;">
                      by IMV • Reach Higher. Live Brighter.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px; color: #F8FAFC;">
              <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #F8FAFC;">
                Hello ${userName || 'Student'},
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin: 0 0 28px 0;">
                This is an automated academic alert from your ZENITH assistant: an assignment deadline is approaching within the next 24 hours.
              </p>

              <!-- Assignment Info Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0B1020; border-radius: 12px; border: 1px solid #1E293B; padding: 24px; margin-bottom: 28px;">
                <tr>
                  <td>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                          Assignment
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 17px; font-weight: 800; color: #F8FAFC; padding-bottom: 16px;">
                          ${assignmentTitle}
                        </td>
                      </tr>
                    </table>

                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #1E293B; padding-top: 16px;">
                      <tr>
                        <td width="50%" valign="top" style="padding-bottom: 12px;">
                          <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 600;">Subject</div>
                          <div style="font-size: 13px; font-weight: 700; color: #00D4FF; margin-top: 2px;">${subject}</div>
                        </td>
                        <td width="50%" valign="top" style="padding-bottom: 12px;">
                          <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 600;">Priority</div>
                          <div style="font-size: 12px; font-weight: 800; color: ${priorityColor}; text-transform: uppercase; margin-top: 2px;">
                            ${priority} Priority
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" valign="top">
                          <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 600;">Deadline</div>
                          <div style="font-size: 13px; font-weight: 700; color: #F8FAFC; margin-top: 2px;">${deadlineFormatted}</div>
                        </td>
                        <td width="50%" valign="top">
                          <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 600;">Est. Focus Time</div>
                          <div style="font-size: 13px; font-weight: 700; color: #F8FAFC; margin-top: 2px;">${estimatedStudyTime}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- AI Recommendation Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(37, 99, 255, 0.08); border-left: 4px solid #2563FF; border-radius: 6px; padding: 16px; margin-bottom: 32px;">
                <tr>
                  <td style="font-size: 13px; line-height: 1.5; color: #F8FAFC;">
                    <strong style="color: #00D4FF;">ZENITH Recommendation:</strong> Complete a focused study block today to prevent deadline pressure. Review your 7-day study schedule in the planner.
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563FF 0%, #1D4ED8 50%, #00D4FF 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 32px; border-radius: 10px; border: 1px solid #00D4FF; box-shadow: 0 4px 14px rgba(37, 99, 255, 0.35);">
                      Open ZENITH Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #0B1020; padding: 24px; border-top: 1px solid #1E293B; font-size: 12px; color: #94A3B8; line-height: 1.5;">
              <div style="font-weight: 800; color: #F8FAFC; font-size: 13px; letter-spacing: 1px;">ZENITH v1.1</div>
              <div style="color: #00D4FF; font-weight: 700; font-size: 10px; margin-top: 2px; text-transform: uppercase;">by IMV • Reach Higher. Live Brighter.</div>
              <div style="margin-top: 8px; color: #64748B;">AI-Powered Student Productivity Platform</div>
              <div style="margin-top: 12px; font-size: 10px; color: #475569;">
                You are receiving this automated alert based on your stored syllabus commitments.
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
