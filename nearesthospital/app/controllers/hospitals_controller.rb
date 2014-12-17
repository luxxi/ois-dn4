class HospitalsController < ApplicationController

  def hospitals
    longitude = params[:longitude]
    latitude = params[:latitude]


    @client = GooglePlaces::Client.new(ENV['googleplaces'])
    #@hospitals = @client.spots(46.34301147317693, 15.16968383447963, types: 'hospital', radius: 100000)
    @hospitals = @client.spots_by_query("Hospital near #{latitude}, #{longitude}", :types => 'hospital').first
    #@hospitals = JSON.parse(file)


    logger.info "long #{params[:longitude]}"
    logger.info "lat #{params[:latitude]}"
    logger.info "hos #{@hospitals}"
    logger.info "hos #{@hospitals['name']}"
    logger.info "hos long #{@hospitals['lng']}"
    logger.info "hos lat #{@hospitals['lat']}"
    logger.info "hos add #{@hospitals['formatted_address']}"

    render json: @hospitals
  end

  def mail
    logger.info "#{params[:mail]} lalal"
    Alert.alert_notification(params[:mail], params[:message]).deliver
  end
end
