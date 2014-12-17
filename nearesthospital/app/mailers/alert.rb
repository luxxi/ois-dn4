class Alert < ActionMailer::Base
  default from: "take@care.com"

  # Subject can be set in your I18n file at config/locales/en.yml
  # with the following lookup:
  #
  #   en.alert.alert_notification.subject
  #
  def alert_notification(mail, message)
    @problem = message

    mail(to: [mail, "luka@domitrovic.si"], subject: "Alert!")
  end
end
